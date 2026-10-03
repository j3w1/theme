// ==WindhawkMod==
// @id j3w1-explorer-native
// @name j3w1 Explorer native colors
// @description Generated native Explorer canvas and text adapter; exact host only
// @version 1.7
// @author j3w1
// @include explorer.exe
// @architecture x86-64
// @compilerOptions -luxtheme -lgdi32 -luser32 -lversion -lmsimg32 -ldwmapi -lshell32 -lcomctl32 -luuid -lole32 -lwindowscodecs -lbcrypt
// ==/WindhawkMod==
// ==WindhawkModSettings==
/*
- folderFill: "#7d1310"
- folderEdge: "#e53935"
- background: "#000000"
- foreground: "#e99499"
- hover: "#1c0a09"
- selected: "#531310"
- inactive: "#420f0c"
- border: "#2b0e0d"
- pin: "#e53935"
- scrollbar: "#420f0c"
- scrollbarHover: "#911410"
- disabled: "#8a5559"
- textSelection: "#911410"
- textSelectionText: "#f4eeee"
- focusRing: "#e53935"
- menuHover: "#630f0d"
- menuHoverText: "#f4eeee"
- menuBorder: "#e53935"
- marquee: "#1f911410"
- marqueeBorder: "#e53935"
*/
// ==/WindhawkModSettings==
#include <windows.h>
#include <wincodec.h>
#include <bcrypt.h>
#include <uxtheme.h>
#include <vssym32.h>
#include <vsstyle.h>
#include <vector>
#include <cwchar>
#include <atomic>
#include <dwmapi.h>
#include <algorithm>
#include <new>
#include <cstring>
#include <commctrl.h>
#include <tlhelp32.h>
#include <shellapi.h>
#include <shlobj.h>
#include <commoncontrols.h>
#include <mutex>
#include <span>

static COLORREF background, foreground, hover, selected, inactive, border, scrollbar, scrollbarHover, disabled;
static COLORREF textSelection, textSelectionText, focusRing, menuHover, menuHoverText, menuBorder;
static COLORREF marquee, marqueeBorder;
static COLORREF pin;
static BYTE marqueeAlpha;
static HBRUSH backgroundBrush;
using ThemeClassFn=HRESULT(WINAPI*)(HTHEME,LPWSTR,int);
static ThemeClassFn themeClass;
static decltype(&FillRect) originalFillRect;
static decltype(&SetTextColor) originalSetTextColor;
static decltype(&SetBkColor) originalSetBkColor;
static decltype(&ExtTextOutW) originalExtTextOut;
static decltype(&PatBlt) originalPatBlt;
static decltype(&Polyline) originalPolyline;
static decltype(&GetThemeColor) originalGetThemeColor;
static decltype(&DrawThemeTextEx) originalDrawThemeTextEx;
static decltype(&BeginPaint) originalBeginPaint;
static decltype(&EndPaint) originalEndPaint;
static decltype(&TrackPopupMenu) originalTrackPopupMenu;
static decltype(&TrackPopupMenuEx) originalTrackPopupMenuEx;
static thread_local HWND menuOwner=nullptr;
static thread_local unsigned menuDepth=0;
static decltype(&DrawThemeBackground) originalDrawThemeBackground;
static decltype(&DrawThemeBackgroundEx) originalDrawThemeBackgroundEx;
static thread_local std::vector<HWND> paintWindows;
static std::atomic<bool> enabled{false};
static thread_local bool drawingTheme=false;
static decltype(&DefWindowProcW) originalDefWindowProc;
static decltype(&SetScrollInfo) originalSetScrollInfo;
static thread_local HWND defaultWindow=nullptr;
static void RefreshCaption(HWND window);
// Nonclient scrollbars paint during default window handling and SetScrollInfo,
// outside BeginPaint. Both paths share the most recent actual HWND; nested calls
// restore the previous origin. This scope is used only for ScrollBar theme draws.
struct DefaultPaintScope {
    HWND previous;
    explicit DefaultPaintScope(HWND window):previous(defaultWindow){defaultWindow=window;}
    ~DefaultPaintScope(){defaultWindow=previous;}
};
static LRESULT WINAPI DefaultWindowHook(HWND window,UINT message,WPARAM wParam,LPARAM lParam) {
    DefaultPaintScope scope(window);
    if(message==WM_THEMECHANGED || message==WM_SETTINGCHANGE)RefreshCaption(window);
    return originalDefWindowProc(window,message,wParam,lParam);
}

static int WINAPI ScrollInfoHook(HWND window,int bar,LPCSCROLLINFO info,BOOL redraw) {
    DefaultPaintScope scope(window);
    return originalSetScrollInfo(window,bar,info,redraw);
}

static bool HighContrast() {
    HIGHCONTRASTW value{sizeof(value)};
    return !SystemParametersInfoW(SPI_GETHIGHCONTRAST,sizeof(value),&value,0)
        || (value.dwFlags&HCF_HIGHCONTRASTON);
}
static bool ExplorerWindow(HWND window) {
    if(!window) return false;
    wchar_t child[64]{};
    if(!GetClassNameW(window,child,64) || wcsstr(child,L"RichEdit")) return false;
    wchar_t name[64]{};
    if(!GetClassNameW(GetAncestor(window,GA_ROOT),name,64)) return false;
    return _wcsicmp(name,L"CabinetWClass")==0 && !HighContrast();
}
// Native caption buttons are composed above a transparent XAML title strip.
// Keep their hit testing, geometry and commands; color the DWM backing instead.
// Caption/text colors are write-only DWM attributes. The admitted native host
// starts with default colors; later application requests are captured verbatim.
struct CaptionState {
    HWND window;
    COLORREF caption=DWMWA_COLOR_DEFAULT,text=DWMWA_COLOR_DEFAULT;
    DWORD backdrop;
};
static std::vector<CaptionState*> captionStates;
static SRWLOCK captionLock=SRWLOCK_INIT;
static constexpr PCWSTR captionProperty=L"j3w1-explorer-native-caption";
static decltype(&DwmSetWindowAttribute) originalDwmSetWindowAttribute;
static decltype(&CreateWindowExW) originalCreateWindowEx;
static decltype(&DestroyWindow) originalDestroyWindow;
static bool CaptionWindow(HWND window) {
    DWORD process=0;GetWindowThreadProcessId(window,&process);
    wchar_t name[64]{};
    return process==GetCurrentProcessId() && GetAncestor(window,GA_ROOT)==window
        && GetClassNameW(window,name,64) && _wcsicmp(name,L"CabinetWClass")==0;
}
struct CaptionGuard {
    CaptionGuard(){AcquireSRWLockExclusive(&captionLock);}
    ~CaptionGuard(){ReleaseSRWLockExclusive(&captionLock);}
};
static CaptionState* OwnedCaption(HWND window) {
    auto state=(CaptionState*)GetPropW(window,captionProperty);
    return std::find(captionStates.begin(),captionStates.end(),state)!=captionStates.end()?state:nullptr;
}
static void RestoreCaptionLocked(CaptionState* state) {
    if(GetPropW(state->window,captionProperty)==state) {
        originalDwmSetWindowAttribute(state->window,DWMWA_CAPTION_COLOR,&state->caption,sizeof(state->caption));
        originalDwmSetWindowAttribute(state->window,DWMWA_TEXT_COLOR,&state->text,sizeof(state->text));
        originalDwmSetWindowAttribute(state->window,DWMWA_SYSTEMBACKDROP_TYPE,&state->backdrop,sizeof(state->backdrop));
        RemovePropW(state->window,captionProperty);
    }
    captionStates.erase(std::remove(captionStates.begin(),captionStates.end(),state),captionStates.end());
    delete state;
}
static bool PaintCaptionLocked(CaptionState* state) {
    DWORD none=DWMSBT_NONE;
    return SUCCEEDED(originalDwmSetWindowAttribute(state->window,DWMWA_CAPTION_COLOR,&background,sizeof(background)))
        && SUCCEEDED(originalDwmSetWindowAttribute(state->window,DWMWA_TEXT_COLOR,&foreground,sizeof(foreground)))
        && SUCCEEDED(originalDwmSetWindowAttribute(state->window,DWMWA_SYSTEMBACKDROP_TYPE,&none,sizeof(none)));
}
static void RefreshCaption(HWND window) {
    if(!CaptionWindow(window) || !originalDwmSetWindowAttribute)return;
    CaptionGuard guard;
    auto state=OwnedCaption(window);
    if(!state && GetPropW(window,captionProperty))return;
    if(!enabled.load() || HighContrast()) {if(state)RestoreCaptionLocked(state);return;}
    if(!state) {
        DWORD backdrop=0;
        if(FAILED(DwmGetWindowAttribute(window,DWMWA_SYSTEMBACKDROP_TYPE,&backdrop,sizeof(backdrop))))return;
        state=new(std::nothrow) CaptionState{window,DWMWA_COLOR_DEFAULT,DWMWA_COLOR_DEFAULT,backdrop};
        if(!state)return;
        if(!SetPropW(window,captionProperty,state)){delete state;return;}
        captionStates.push_back(state);
    }
    if(!PaintCaptionLocked(state))RestoreCaptionLocked(state);
}
static HRESULT WINAPI DwmAttributeHook(HWND window,DWORD attribute,LPCVOID value,DWORD size) {
    if(!CaptionWindow(window) || !value || size!=sizeof(DWORD)
       || (attribute!=DWMWA_CAPTION_COLOR && attribute!=DWMWA_TEXT_COLOR && attribute!=DWMWA_SYSTEMBACKDROP_TYPE))
        return originalDwmSetWindowAttribute(window,attribute,value,size);
    CaptionGuard guard;
    auto state=OwnedCaption(window);
    if(!state)return originalDwmSetWindowAttribute(window,attribute,value,size);
    DWORD requested;memcpy(&requested,value,sizeof(requested));
    DWORD themed=attribute==DWMWA_CAPTION_COLOR?background:attribute==DWMWA_TEXT_COLOR?foreground:DWMSBT_NONE;
    bool active=enabled.load() && !HighContrast();
    HRESULT result=originalDwmSetWindowAttribute(window,attribute,active?&themed:value,size);
    if(SUCCEEDED(result)) {
        if(attribute==DWMWA_CAPTION_COLOR)state->caption=requested;
        else if(attribute==DWMWA_TEXT_COLOR)state->text=requested;
        else state->backdrop=requested;
    }
    if(!active)RestoreCaptionLocked(state);
    return result;
}
static HWND WINAPI CreateWindowHook(DWORD exStyle,LPCWSTR className,LPCWSTR title,DWORD style,
    int x,int y,int width,int height,HWND parent,HMENU menu,HINSTANCE instance,LPVOID parameter) {
    HWND window=originalCreateWindowEx(exStyle,className,title,style,x,y,width,height,parent,menu,instance,parameter);
    if(window)RefreshCaption(window);
    return window;
}
static BOOL WINAPI DestroyWindowHook(HWND window) {
    {CaptionGuard guard;auto state=OwnedCaption(window);if(state)RestoreCaptionLocked(state);}
    return originalDestroyWindow(window);
}
static BOOL CALLBACK RefreshFolderCaption(HWND window,LPARAM) {RefreshCaption(window);return TRUE;}
static void RestoreCaptions() {CaptionGuard guard;while(!captionStates.empty())RestoreCaptionLocked(captionStates.back());}
// The recorded UIMarqueeSelector has no control ID. Match public vtable
// symbols and its actual UIItemsView root/ HWND, never foreground or blue pixels.
using ElementRootFn=void*(__cdecl*)(void*);
using ElementWindowFn=HWND(__cdecl*)(void*);
using ElementBackgroundFn=void(__cdecl*)(void*,HDC,void*,const RECT&,const RECT&,const RECT&,const RECT&);
using ElementBorderFn=void(__cdecl*)(void*,HDC,void*,RECT*,const RECT&);
static void* marqueeVtable;
static void* itemsViewVtable;
static ElementRootFn elementRoot;
static ElementWindowFn elementWindow;
static ElementBackgroundFn originalElementBackground;
static ElementBorderFn originalElementBorder;
static decltype(&GetSysColor) originalSysColor;
static decltype(&GdiAlphaBlend) originalAlphaBlend;
enum class MarqueePaint { None, Background, Border };
static thread_local MarqueePaint marqueePaint=MarqueePaint::None;
static bool MarqueeElement(void* element) {
    if(!enabled.load() || drawingTheme || HighContrast() || !element || !marqueeVtable
       || !itemsViewVtable || !elementRoot || !elementWindow || *(void**)element!=marqueeVtable)return false;
    void* root=elementRoot(element);
    return root && *(void**)root==itemsViewVtable && ExplorerWindow(elementWindow(root));
}
struct MarqueePaintScope {
    MarqueePaint previous;
    MarqueePaintScope(void* element,MarqueePaint kind):previous(marqueePaint) {
        marqueePaint=MarqueeElement(element)?kind:MarqueePaint::None;
    }
    ~MarqueePaintScope(){marqueePaint=previous;}
};
static void __cdecl ElementBackgroundHook(void* element,HDC dc,void* value,
    const RECT& a,const RECT& b,const RECT& c,const RECT& d) {
    MarqueePaintScope scope(element,MarqueePaint::Background);
    originalElementBackground(element,dc,value,a,b,c,d);
}
static void __cdecl ElementBorderHook(void* element,HDC dc,void* value,RECT* rect,const RECT& clip) {
    MarqueePaintScope scope(element,MarqueePaint::Border);
    originalElementBorder(element,dc,value,rect,clip);
}
static DWORD WINAPI SysColorHook(int index) {
    if(enabled.load() && !drawingTheme && !HighContrast()) {
        if(marqueePaint==MarqueePaint::Background && index==COLOR_HOTLIGHT)return marquee;
        if(marqueePaint==MarqueePaint::Border && index==COLOR_HIGHLIGHT)return marqueeBorder;
    }
    return originalSysColor(index);
}
static BOOL WINAPI AlphaBlendHook(HDC dest,int x,int y,int width,int height,HDC src,
    int sx,int sy,int sw,int sh,BLENDFUNCTION blend) {
    // Observed native constant-alpha background composition. Keep per-pixel
    // alpha, other opacity values and all source pixels untouched.
    if(enabled.load() && !drawingTheme && !HighContrast() && marqueePaint==MarqueePaint::Background
       && blend.BlendOp==AC_SRC_OVER && blend.BlendFlags==0
       && blend.AlphaFormat==0 && blend.SourceConstantAlpha==85)blend.SourceConstantAlpha=marqueeAlpha;
    return originalAlphaBlend(dest,x,y,width,height,src,sx,sy,sw,sh,blend);
}
static void* FindExactSymbol(HMODULE module,PCWSTR expected) {
    WH_FIND_SYMBOL symbol{};
    HANDLE search=Wh_FindFirstSymbol(module,nullptr,&symbol);
    if(!search)return nullptr;
    void* found=nullptr;
    do {if(symbol.symbol && wcscmp(symbol.symbol,expected)==0){found=symbol.address;break;}}
    while(Wh_FindNextSymbol(search,&symbol));
    Wh_FindCloseSymbol(search);
    return found;
}
static bool FixedModuleVersion(HMODULE module,DWORD ms,DWORD ls) {
    if(!module)return false;
    wchar_t file[MAX_PATH]{};
    if(!GetModuleFileNameW(module,file,MAX_PATH))return false;
    DWORD ignored=0,size=GetFileVersionInfoSizeW(file,&ignored);
    std::vector<BYTE> bytes(size);VS_FIXEDFILEINFO* version=nullptr;UINT length=0;
    return size && GetFileVersionInfoW(file,0,size,bytes.data())
        && VerQueryValueW(bytes.data(),L"\\",(void**)&version,&length)
        && length>=sizeof(*version) && version->dwFileVersionMS==ms && version->dwFileVersionLS==ls;
}
using ImageListDrawFn=HRESULT(__cdecl*)(void*,IMAGELISTDRAWPARAMS*);
static ImageListDrawFn originalImageListDraw;
static decltype(&ImageList_GetImageCount) imageListCount;
static decltype(&ImageList_GetIconSize) imageListSize;
static decltype(&ImageList_GetIcon) originalImageListGetIcon;
static HWND PaintOwner(HDC dc) {
    HWND window=WindowFromDC(dc);
    return window?window:paintWindows.empty()?nullptr:paintWindows.back();
}
// Generated original folder artwork shares the ICO generator's geometry.
// Only initialization queries stock glyphs or allocates image lists. Painting
// compares the current source glyph exactly; cached slot identity is insufficient.
namespace FolderGlyph {
struct Stock { bool open; std::vector<DWORD> pixels; };
struct Frame { int size; HBITMAP bitmap=nullptr; DWORD* pixels=nullptr;
    HIMAGELIST images[2]{}; std::vector<Stock> stock,iconStock; };
[[clang::no_destroy]] static std::mutex lock;
[[clang::no_destroy]] static std::vector<Frame> frames;
static thread_local bool painting=false;
// Native extraction can reenter CImageList::Draw. Suppress only this adapter's
// folder substitution while obtaining or inspecting its source identity.
struct NativeGuard {
    bool prior=painting;
    NativeGuard(){painting=true;}
    ~NativeGuard(){painting=prior;}
    NativeGuard(const NativeGuard&)=delete;
    NativeGuard& operator=(const NativeGuard&)=delete;
};
static HICON NativeIcon(HIMAGELIST images,int index,UINT flags) {
    NativeGuard guard;return originalImageListGetIcon(images,index,flags);
}
static constexpr POINT back[]={{2,5},{3,4},{11,4},{14,7},{29,7},{30,8},{30,27},{2,27}};
static constexpr POINT closedFront[]={{2,11},{30,11},{30,27},{29,28},{3,28},{2,27}};
static constexpr POINT openFront[]={{5,12},{31,12},{27,28},{1,28}};
struct DC {
    HDC value;HGDIOBJ prior=nullptr;
    explicit DC(HDC input):value(input){}
    ~DC(){if(value){if(prior&&prior!=HGDI_ERROR)SelectObject(value,prior);DeleteDC(value);}}
};
struct List {IImageList* value=nullptr;~List(){if(value)value->Release();}};
static bool Inside(double x,double y,std::span<const POINT> points) {
    bool inside=false;
    for(size_t i=0,j=points.size()-1;i<points.size();j=i++) {
        auto a=points[i],b=points[j];
        if((a.y>y)!=(b.y>y) && x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    }
    return inside;
}
static void Raster(DWORD* pixels,int size,bool open,COLORREF fill,COLORREF edge) {
    std::span<const POINT> front=open?std::span<const POINT>(openFront):std::span<const POINT>(closedFront);
    for(int y=0;y<size;y++)for(int x=0;x<size;x++) {
        unsigned sum[3]{},coverage=0;
        for(int sy=0;sy<4;sy++)for(int sx=0;sx<4;sx++) {
            double u=(x+(sx+.5)/4)*32/size,v=(y+(sy+.5)/4)*32/size;
            bool panel=Inside(u,v,front);
            if(!panel&&!Inside(u,v,back))continue;
            COLORREF color=panel?fill:edge;++coverage;
            sum[0]+=GetRValue(color);sum[1]+=GetGValue(color);sum[2]+=GetBValue(color);
        }
        DWORD pixel=0;
        if(coverage) {
            unsigned alpha=(coverage*255+8)/16;
            auto channel=[&](unsigned value){unsigned straight=(value+coverage/2)/coverage;return (straight*alpha+127)/255;};
            pixel=(alpha<<24)|(channel(sum[0])<<16)|(channel(sum[1])<<8)|channel(sum[2]);
        }
        pixels[y*size+x]=pixel;
    }
}
static void Clear() {
    for(auto& frame:frames) {
        if(frame.bitmap)DeleteObject(frame.bitmap);
        for(auto images:frame.images)if(images)ImageList_Destroy(images);
    }
    frames.clear();
}
static HBITMAP Bitmap(int size,DWORD** pixels) {
    BITMAPINFO info{};info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);
    info.bmiHeader.biWidth=size;info.bmiHeader.biHeight=-size;
    info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;
    return CreateDIBSection(nullptr,&info,DIB_RGB_COLORS,reinterpret_cast<void**>(pixels),nullptr,0);
}
// Read only the current HICON's dimensions; monochrome and unknown icons stay native.
static int IconSize(HICON icon) {
    ICONINFO info{};if(!icon||!GetIconInfo(icon,&info))return 0;
    BITMAP bitmap{};bool known=info.hbmColor&&GetObjectW(info.hbmColor,sizeof(bitmap),&bitmap)==sizeof(bitmap);
    if(info.hbmColor)DeleteObject(info.hbmColor);
    if(info.hbmMask)DeleteObject(info.hbmMask);
    return known&&bitmap.bmWidth==bitmap.bmHeight&&bitmap.bmWidth>0&&bitmap.bmWidth<=256?bitmap.bmWidth:0;
}

static bool Build(COLORREF fill,COLORREF edge) {
    SHSTOCKICONINFO info[2]{{sizeof(SHSTOCKICONINFO)},{sizeof(SHSTOCKICONINFO)}};
    if(FAILED(SHGetStockIconInfo(SIID_FOLDER,SHGSI_SYSICONINDEX,&info[0]))
       ||FAILED(SHGetStockIconInfo(SIID_FOLDEROPEN,SHGSI_SYSICONINDEX,&info[1])))return false;
    for(int size:{16,20,24,32,40,48,64,72,96,128,144,192,256}) {
        frames.push_back({size});auto& frame=frames.back();
        frame.bitmap=Bitmap(size,&frame.pixels);if(!frame.bitmap)return false;
        for(unsigned open=0;open<2;open++) {
            // The image list owns a copy; release the temporary artwork DIB.
            DWORD* pixels=nullptr;HBITMAP artwork=Bitmap(size,&pixels);if(!artwork)return false;
            Raster(pixels,size,open!=0,fill,edge);
            frame.images[open]=ImageList_Create(size,size,ILC_COLOR32|ILC_MASK,1,0);
            bool added=frame.images[open]&&ImageList_Add(frame.images[open],artwork,nullptr)==0;
            DeleteObject(artwork);if(!added)return false;
        }
        DC dc(CreateCompatibleDC(nullptr));if(!dc.value)return false;
        dc.prior=SelectObject(dc.value,frame.bitmap);
        if(!dc.prior||dc.prior==HGDI_ERROR)return false;
        auto captureIcon=[&](HICON icon,bool open) {
            if(IconSize(icon)!=size)return;
            memset(frame.pixels,0,size*size*4);
            if(DrawIconEx(dc.value,0,0,icon,size,size,0,nullptr,DI_NORMAL)) {
                GdiFlush();std::vector<DWORD> pixels(frame.pixels,frame.pixels+size*size);
                if(std::any_of(pixels.begin(),pixels.end(),[](DWORD p){return p!=0;})
                   &&std::none_of(frame.iconStock.begin(),frame.iconStock.end(),[&](auto const& stock){return stock.open==open&&stock.pixels==pixels;}))
                    frame.iconStock.push_back({open,std::move(pixels)});
            }
            SecureZeroMemory(frame.pixels,size*size*4);
        };
        for(unsigned open=0;open<2;open++)for(UINT flags:{UINT(SHGSI_ICON|SHGSI_SMALLICON),UINT(SHGSI_ICON|SHGSI_LARGEICON)}) {
            SHSTOCKICONINFO icon{sizeof(icon)};
            if(SUCCEEDED(SHGetStockIconInfo(open?SIID_FOLDEROPEN:SIID_FOLDER,flags,&icon))&&icon.hIcon){captureIcon(icon.hIcon,open!=0);DestroyIcon(icon.hIcon);}
        }
        // Tab bitmaps use resource extraction at their exact physical size,
        // which can differ from the system image-list glyph at that same size.
        // Cache both complete stock identities; never add a pixel tolerance.
        for(unsigned open=0;open<2;open++) {
            SHSTOCKICONINFO resource{sizeof(resource)};
            if(SUCCEEDED(SHGetStockIconInfo(open?SIID_FOLDEROPEN:SIID_FOLDER,SHGSI_ICONLOCATION,&resource))) {
                HICON extracted=nullptr;
                if(SUCCEEDED(SHDefExtractIconW(resource.szPath,resource.iIcon,0,&extracted,nullptr,static_cast<UINT>(size)))&&extracted) {
                    captureIcon(extracted,open!=0);DestroyIcon(extracted);
                }
            }
        }
        for(int kind=0;kind<=4;kind++) {
            List images;
            if(FAILED(SHGetImageList(kind,__uuidof(IImageList),reinterpret_cast<void**>(&images.value))))continue;
            for(unsigned open=0;open<2;open++) {
                HICON icon=nullptr;
                if(SUCCEEDED(images.value->GetIcon(info[open].iSysImageIndex,ILD_NORMAL,&icon))&&icon){captureIcon(icon,open!=0);DestroyIcon(icon);}
                memset(frame.pixels,0,size*size*4);
                IMAGELISTDRAWPARAMS draw{sizeof(draw)};draw.himl=reinterpret_cast<HIMAGELIST>(images.value);
                draw.i=info[open].iSysImageIndex;draw.hdcDst=dc.value;draw.cx=draw.cy=size;
                draw.rgbBk=CLR_NONE;draw.rgbFg=CLR_DEFAULT;draw.fStyle=ILD_TRANSPARENT|ILD_SCALE;
                if(SUCCEEDED(images.value->Draw(&draw))) {
                    GdiFlush();std::vector<DWORD> pixels(frame.pixels,frame.pixels+size*size);
                    bool visible=std::any_of(pixels.begin(),pixels.end(),[](DWORD p){return p!=0;});
                    if(visible&&std::none_of(frame.stock.begin(),frame.stock.end(),[&](auto const& stock){return stock.open==(open!=0)&&stock.pixels==pixels;}))
                        frame.stock.push_back({open!=0,std::move(pixels)});
                }
            }
        }
        SecureZeroMemory(frame.pixels,size*size*4);
        if(frame.stock.empty())return false;
    }
    return true;
}
static HWND Owner(HDC dc) {
    HWND window=PaintOwner(dc);if(window)return window;
    GUITHREADINFO state{sizeof(state)};
    return GetGUIThreadInfo(GetCurrentThreadId(),&state)?state.hwndActive:nullptr;
}
// Match complete, unscaled current pixels against stock references prewarmed at
// initialization. Copy borrows its input and returns a separately owned icon for
// WIC conversion; Acquire consumes and replaces the caller-owned image-list
// result. Source lists, input icons and custom/overlay glyphs are untouched.
static HICON Copy(HICON icon,bool reviewedCaller) {
    if(!reviewedCaller||!enabled.load()||painting||drawingTheme||HighContrast()
       ||!originalImageListGetIcon)return nullptr;
    HWND window=Owner(nullptr);DWORD process=0;
    if(!window||!GetWindowThreadProcessId(window,&process)||process!=GetCurrentProcessId()||!ExplorerWindow(window))return nullptr;
    int size=IconSize(icon);if(!size)return nullptr;
    std::unique_lock guard(lock);if(!enabled.load())return nullptr;
    auto found=std::find_if(frames.begin(),frames.end(),[&](auto const& frame){return frame.size==size;});
    if(found==frames.end())return nullptr;
    auto& frame=*found;DC dc(CreateCompatibleDC(nullptr));if(!dc.value)return nullptr;
    dc.prior=SelectObject(dc.value,frame.bitmap);if(!dc.prior||dc.prior==HGDI_ERROR)return nullptr;
    memset(frame.pixels,0,size*size*4);int matched=-1;NativeGuard native;
    if(DrawIconEx(dc.value,0,0,icon,size,size,0,nullptr,DI_NORMAL)) {
        GdiFlush();for(auto const& stock:frame.iconStock)
            if(memcmp(frame.pixels,stock.pixels.data(),size*size*4)==0){matched=stock.open?1:0;break;}
    }
    SecureZeroMemory(frame.pixels,size*size*4);
    if(matched<0)return nullptr;
    HICON replacement=NativeIcon(frame.images[matched],0,ILD_NORMAL);
    if(!replacement)return nullptr;
    return replacement;
}
static HICON Acquire(HICON icon,UINT flags,bool reviewedCaller) {
    if(flags!=ILD_NORMAL)return icon;
    HICON replacement=Copy(icon,reviewedCaller);
    if(!replacement)return icon;
    if(!DestroyIcon(icon)){DestroyIcon(replacement);return icon;}
    return replacement;
}


static bool Draw(void* self,IMAGELISTDRAWPARAMS* request,HRESULT* result) {
    if(!enabled.load()||painting||drawingTheme||HighContrast()||!request
       ||(request->cbSize!=sizeof(*request)&&request->cbSize!=96)
       ||request->xBitmap||request->yBitmap||request->fState!=ILS_NORMAL
       ||(request->fStyle&ILD_OVERLAYMASK)||!originalImageListDraw
       ||GetMapMode(request->hdcDst)!=MM_TEXT||GetLayout(request->hdcDst)!=0)return false;
    HWND window=Owner(request->hdcDst);DWORD process=0;
    if(!window||!GetWindowThreadProcessId(window,&process)||process!=GetCurrentProcessId()||!ExplorerWindow(window))return false;
    int width=request->cx,height=request->cy;
    if(!width&&!height) {
        if(!imageListSize||!imageListSize(request->himl,&width,&height))return false;
    }
    if(width!=height||width<=0||width>256)return false;
    std::unique_lock guard(lock);if(!enabled.load())return false;
    auto found=std::find_if(frames.begin(),frames.end(),[&](auto const& frame){return frame.size==width;});
    if(found==frames.end())return false;
    auto& frame=*found;HDC dc=CreateCompatibleDC(request->hdcDst);if(!dc)return false;
    auto prior=SelectObject(dc,frame.bitmap);
    if(!prior||prior==HGDI_ERROR){DeleteDC(dc);return false;}
    // The recorded shell also sends a 96-byte request. Preserve its opaque
    // extension; never pass an 88-byte stack copy with cbSize claiming 96.
    alignas(IMAGELISTDRAWPARAMS) unsigned char copy[96]{};
    memcpy(copy,request,request->cbSize);
    auto& probe=*reinterpret_cast<IMAGELISTDRAWPARAMS*>(copy);
    probe.hdcDst=dc;probe.x=probe.y=probe.xBitmap=probe.yBitmap=0;probe.cx=width;probe.cy=height;
    probe.rgbBk=CLR_NONE;probe.rgbFg=CLR_DEFAULT;probe.fStyle=ILD_TRANSPARENT|ILD_SCALE;
    probe.Frame=0;probe.crEffect=0;
    memset(frame.pixels,0,width*height*4);painting=true;
    HRESULT read=originalImageListDraw(self,&probe);GdiFlush();int matched=-1;
    if(SUCCEEDED(read))for(auto const& stock:frame.stock)
        if(memcmp(frame.pixels,stock.pixels.data(),stock.pixels.size()*4)==0){matched=stock.open?1:0;break;}
    // Source images may be document thumbnails. Retain no source pixels.
    SecureZeroMemory(frame.pixels,width*height*4);
    SelectObject(dc,prior);DeleteDC(dc);
    bool drawn=false;
    if(matched>=0) {
        memcpy(copy,request,request->cbSize);
        auto& themed=*reinterpret_cast<IMAGELISTDRAWPARAMS*>(copy);
        themed.himl=frame.images[matched];themed.i=0;
        drawn=ImageList_DrawIndirect(&themed)!=FALSE;
    }
    painting=false;
    if(drawn)*result=S_OK;
    return drawn; // Native fallback happens after releasing the cache mutex.
}
static bool Init(COLORREF fill,COLORREF edge) {
    HRESULT apartment=CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED);
    if(FAILED(apartment))return false;
    bool built=false;
    try {built=Build(fill,edge);}catch(...) {}
    CoUninitialize();if(!built)Clear();return built;
}
static void Uninit(){std::lock_guard guard(lock);Clear();}
}

// The tab's XAML SoftwareBitmapSource is created through this public WIC
// method. The borrowed HICON and caller-owned IWICBitmap follow native lifetime
// rules; only an exact stock folder gets an independent themed input icon.
namespace FolderBitmap {
using ConvertFn=HRESULT(STDMETHODCALLTYPE*)(IWICImagingFactory*,HICON,IWICBitmap**);
static ConvertFn originalConvert=nullptr;
static IWICImagingFactory* retainedFactory=nullptr;
static HMODULE retainedShell=nullptr;
[[clang::no_destroy]] static std::mutex moduleLock;
static bool Digest(HMODULE module,const char* expected) noexcept {
    // RAII also covers allocation failure while preparing the hash object.
    struct Reader {
        HANDLE file=INVALID_HANDLE_VALUE;
        BCRYPT_ALG_HANDLE algorithm=nullptr;BCRYPT_HASH_HANDLE hash=nullptr;
        std::vector<BYTE> object;
        ~Reader(){if(hash)BCryptDestroyHash(hash);if(algorithm)BCryptCloseAlgorithmProvider(algorithm,0);if(file!=INVALID_HANDLE_VALUE)CloseHandle(file);}
    } reader;
    try {
    wchar_t path[32768]{};DWORD length=GetModuleFileNameW(module,path,std::size(path));
    if(!length||length>=std::size(path))return false;
    reader.file=CreateFileW(path,GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr);
    if(reader.file==INVALID_HANDLE_VALUE)return false;
    DWORD size=0,written=0;BYTE digest[32]{};bool valid=false;
    if(BCryptOpenAlgorithmProvider(&reader.algorithm,BCRYPT_SHA256_ALGORITHM,nullptr,0)>=0
       &&BCryptGetProperty(reader.algorithm,BCRYPT_OBJECT_LENGTH,reinterpret_cast<PUCHAR>(&size),sizeof(size),&written,0)>=0) {
        reader.object.resize(size);
        if(BCryptCreateHash(reader.algorithm,&reader.hash,reader.object.data(),size,nullptr,0,0)>=0) {
            BYTE buffer[65536];DWORD count=0;bool complete=false;
            for(;;){if(!ReadFile(reader.file,buffer,sizeof(buffer),&count,nullptr))break;
                if(!count){complete=true;break;}if(BCryptHashData(reader.hash,buffer,count,0)<0)break;}
            if(complete&&BCryptFinishHash(reader.hash,digest,sizeof(digest),0)>=0) {
                constexpr char hex[]="0123456789abcdef";char actual[65]{};
                for(unsigned n=0;n<32;n++){actual[n*2]=hex[digest[n]>>4];actual[n*2+1]=hex[digest[n]&15];}
                valid=strcmp(actual,expected)==0;
            }
        }
    }
    return valid;
    }catch(...){return false;}
}
static bool Caller(void* address) noexcept {
    try {
    HMODULE module=nullptr;
    if(!GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
        reinterpret_cast<LPCWSTR>(address),&module)||module!=GetModuleHandleW(L"windowsudk.shellcommon.dll"))return false;
    std::lock_guard guard(moduleLock);
    if(retainedShell)return module==retainedShell;
    if(!FixedModuleVersion(module,MAKELONG(0,10),MAKELONG(9550,26100))
       ||!Digest(module,"410141eceecfaa5d7cccbfd7c357920988bf18fec3db7f6865eec674677c0204"))return false;
    // Retain the admitted module until hook cleanup so a recycled handle cannot
    // inherit an earlier module's admission. Missing/unknown callers pass through.
    return GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS,reinterpret_cast<LPCWSTR>(address),&retainedShell)!=FALSE;
    }catch(...){return false;}
}
static HRESULT Convert(IWICImagingFactory* factory,HICON icon,IWICBitmap** result,bool reviewed) noexcept {
    DWORD before=GetLastError();HICON themed=nullptr;
    // Never let C++ allocation/locking failures cross the public COM boundary.
    // Fall back before invoking native conversion, which must run exactly once.
    try {if(result)themed=FolderGlyph::Copy(icon,reviewed);}catch(...) {}
    SetLastError(before);HRESULT status=originalConvert(factory,themed?themed:icon,result);DWORD after=GetLastError();
    if(themed)DestroyIcon(themed);SetLastError(after);return status;
}
static HRESULT STDMETHODCALLTYPE Hook(IWICImagingFactory* factory,HICON icon,IWICBitmap** result) noexcept {
    DWORD before=GetLastError();bool reviewed=Caller(__builtin_return_address(0));SetLastError(before);
    return Convert(factory,icon,result,reviewed);
}
static bool Init() noexcept {
    HRESULT apartment=CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED);
    if(FAILED(apartment)&&apartment!=RPC_E_CHANGED_MODE)return false;
    struct Apartment {
        IWICImagingFactory* factory=nullptr;
        bool initialized;
        ~Apartment(){if(factory)factory->Release();if(initialized)CoUninitialize();}
    } apartmentScope{nullptr,SUCCEEDED(apartment)};
    auto& factory=apartmentScope.factory;bool ready=false;
    try {
    if(SUCCEEDED(CoCreateInstance(CLSID_WICImagingFactory,nullptr,CLSCTX_INPROC_SERVER,IID_PPV_ARGS(&factory)))) {
        // IWICImagingFactory inherits IUnknown; CreateBitmapFromHICON is the
        // documented method at slot 22 of the public interface ABI.
        auto function=(*reinterpret_cast<void***>(factory))[22];HMODULE module=nullptr;
        ready=GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
            reinterpret_cast<LPCWSTR>(function),&module)&&module==GetModuleHandleW(L"windowscodecs.dll")
            &&FixedModuleVersion(module,MAKELONG(0,10),MAKELONG(9549,26100))
            &&Digest(module,"ad3f960fc9d612c0289035f1b5c334dd44e423ce6c23059ab5129746cd0646f2")
            &&Wh_SetFunctionHook(function,reinterpret_cast<void*>(Hook),reinterpret_cast<void**>(&originalConvert));
    }
    if(ready){retainedFactory=factory;factory=nullptr;}
    return ready;
    }catch(...){return false;}
}
static void Uninit() {
    if(retainedFactory){retainedFactory->Release();retainedFactory=nullptr;}
    std::lock_guard guard(moduleLock);
    if(retainedShell){FreeLibrary(retainedShell);retainedShell=nullptr;}
}
}

// The exact navigation pin is image 1 of the three-entry TreeView state list.
// Render only that glyph into an owned DIB, retain its coverage alpha and native
// silhouette, then composite the canonical red. Folder/application image lists,
// drag images, checkboxes, unknown requests and high contrast are untouched.
static HRESULT __cdecl NavigationPinHook(void* self,IMAGELISTDRAWPARAMS* request) {
    auto original=[&](){return originalImageListDraw(self,request);};
    HRESULT folderResult=S_OK;if(FolderGlyph::Draw(self,request,&folderResult))return folderResult;
    if(!enabled.load() || drawingTheme || HighContrast() || !request
       || request->cbSize!=sizeof(*request) || request->i!=1
       || request->fStyle!=ILD_SCALE || request->fState!=ILS_NORMAL
       || request->rgbBk!=CLR_NONE || request->cx<=0 || request->cy<=0
       || request->cx>128 || request->cy>128 || GetMapMode(request->hdcDst)!=MM_TEXT
       || GetLayout(request->hdcDst)!=0)return original();
    HWND window=PaintOwner(request->hdcDst);wchar_t name[64]{};
    if(!ExplorerWindow(window) || !GetClassNameW(window,name,64)
       || _wcsicmp(name,L"SysTreeView32")!=0)return original();
    HIMAGELIST state=(HIMAGELIST)SendMessageW(window,TVM_GETIMAGELIST,TVSIL_STATE,0);
    if(!state || ((void*)state!=self && state!=request->himl)
       || !imageListCount || imageListCount(state)!=3)return original();
    HDC buffer=CreateCompatibleDC(request->hdcDst);if(!buffer)return original();
    BITMAPINFO info{};info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);
    info.bmiHeader.biWidth=request->cx;info.bmiHeader.biHeight=-request->cy;
    info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;
    DWORD* pixels=nullptr;HBITMAP bitmap=CreateDIBSection(buffer,&info,DIB_RGB_COLORS,(void**)&pixels,nullptr,0);
    if(!bitmap){DeleteDC(buffer);return original();}
    HGDIOBJ previous=SelectObject(buffer,bitmap);
    if(!previous || previous==HGDI_ERROR){DeleteObject(bitmap);DeleteDC(buffer);return original();}
    memset(pixels,0,request->cx*request->cy*4);
    auto local=*request;local.hdcDst=buffer;local.x=local.y=0;
    drawingTheme=true;HRESULT result=originalImageListDraw(self,&local);drawingTheme=false;
    GdiFlush();bool opaque=false;
    if(SUCCEEDED(result))for(int i=0;i<request->cx*request->cy;i++) {
        DWORD alpha=pixels[i]>>24;opaque|=alpha==255;
        auto premultiply=[&](BYTE channel){return (channel*alpha+127)/255;};
        pixels[i]=(alpha<<24)|(premultiply(GetRValue(pin))<<16)
            |(premultiply(GetGValue(pin))<<8)|premultiply(GetBValue(pin));
    }
    // Unknown formats without an opaque glyph anchor retain their native draw.
    if(SUCCEEDED(result) && opaque) {
        BLENDFUNCTION blend{AC_SRC_OVER,0,255,AC_SRC_ALPHA};
        if(!GdiAlphaBlend(request->hdcDst,request->x,request->y,request->cx,request->cy,
                          buffer,0,0,request->cx,request->cy,blend))result=E_FAIL;
    }else result=E_FAIL;
    SelectObject(buffer,previous);DeleteObject(bitmap);DeleteDC(buffer);
    return FAILED(result)?original():result;
}
static HICON WINAPI FolderIconHook(HIMAGELIST images,int index,UINT flags) {
    HICON icon=FolderGlyph::NativeIcon(images,index,flags);
    HMODULE caller=nullptr;
    bool reviewed=GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
        reinterpret_cast<LPCWSTR>(__builtin_return_address(0)),&caller)
        &&caller==GetModuleHandleW(L"ExplorerFrame.dll");
    return FolderGlyph::Acquire(icon,flags,reviewed);
}
static bool InitNavigationPin() {
    HANDLE snapshot=CreateToolhelp32Snapshot(TH32CS_SNAPMODULE,GetCurrentProcessId());
    if(snapshot==INVALID_HANDLE_VALUE)return false;
    MODULEENTRY32W entry{};entry.dwSize=sizeof(entry);HMODULE module=nullptr;
    if(Module32FirstW(snapshot,&entry))do {
        if(_wcsicmp(entry.szModule,L"comctl32.dll")==0
           && FixedModuleVersion(entry.hModule,MAKELONG(10,6),MAKELONG(9549,26100))) {
            if(module){CloseHandle(snapshot);return false;}module=entry.hModule;
        }
    }while(Module32NextW(snapshot,&entry));
    CloseHandle(snapshot);if(!module)return false;
    imageListCount=(decltype(imageListCount))GetProcAddress(module,"ImageList_GetImageCount");
    imageListSize=(decltype(imageListSize))GetProcAddress(module,"ImageList_GetIconSize");
    void* draw=FindExactSymbol(module,L"public: virtual long __cdecl CImageList::Draw(struct _IMAGELISTDRAWPARAMS *)");
    void* getIcon=reinterpret_cast<void*>(GetProcAddress(module,"ImageList_GetIcon"));
    return imageListCount && imageListSize && draw && getIcon
        && Wh_SetFunctionHook(draw,(void*)NavigationPinHook,(void**)&originalImageListDraw)
        && Wh_SetFunctionHook(getIcon,(void*)FolderIconHook,(void**)&originalImageListGetIcon);
}
static bool InitMarquee() {
    HMODULE frame=GetModuleHandleW(L"ExplorerFrame.dll"),dui=GetModuleHandleW(L"dui70.dll");
    if(!FixedModuleVersion(frame,MAKELONG(0,10),MAKELONG(9549,26100))
       || !FixedModuleVersion(dui,MAKELONG(0,10),MAKELONG(9549,26100)))return false;
    marqueeVtable=FindExactSymbol(frame,L"const UIMarqueeSelector::`vftable'{for `DirectUI::Element'}");
    itemsViewVtable=FindExactSymbol(frame,L"const UIItemsView::`vftable'{for `DirectUI::HWNDElement'}");
    elementRoot=(ElementRootFn)FindExactSymbol(dui,L"public: class DirectUI::Element * __cdecl DirectUI::Element::GetRoot(void)");
    elementWindow=(ElementWindowFn)FindExactSymbol(dui,L"public: virtual struct HWND__ * __cdecl DirectUI::HWNDElement::GetHWND(void)");
    void* bg=FindExactSymbol(dui,L"public: void __cdecl DirectUI::Element::PaintBackground(struct HDC__ *,class DirectUI::Value *,struct tagRECT const &,struct tagRECT const &,struct tagRECT const &,struct tagRECT const &)");
    void* br=FindExactSymbol(dui,L"public: void __cdecl DirectUI::Element::PaintBorder(struct HDC__ *,class DirectUI::Value *,struct tagRECT *,struct tagRECT const &)");
    return marqueeVtable && itemsViewVtable && elementRoot && elementWindow && bg && br
        && Wh_SetFunctionHook(bg,(void*)ElementBackgroundHook,(void**)&originalElementBackground)
        && Wh_SetFunctionHook(br,(void*)ElementBorderHook,(void**)&originalElementBorder)
        && Wh_SetFunctionHook((void*)GetSysColor,(void*)SysColorHook,(void**)&originalSysColor)
        && Wh_SetFunctionHook((void*)GdiAlphaBlend,(void*)AlphaBlendHook,(void**)&originalAlphaBlend);
}
// TrackPopupMenu carries the actual owner. Scope both entry points and restore
// it across nested calls, including unrelated owners; do not infer popup
// ownership from another thread's foreground window or a process-wide flag.
struct MenuPaintScope {
    HWND previousOwner; unsigned previousDepth;
    explicit MenuPaintScope(HWND owner):previousOwner(menuOwner),previousDepth(menuDepth) {
        menuOwner=owner;menuDepth++;
    }
    ~MenuPaintScope(){menuOwner=previousOwner;menuDepth=previousDepth;}
};
static BOOL WINAPI PopupHook(HMENU menu,UINT flags,int x,int y,int reserved,HWND owner,const RECT* exclude) {
    MenuPaintScope scope(owner);
    return originalTrackPopupMenu(menu,flags,x,y,reserved,owner,exclude);
}
static BOOL WINAPI PopupExHook(HMENU menu,UINT flags,int x,int y,HWND owner,LPTPMPARAMS parameters) {
    MenuPaintScope scope(owner);
    return originalTrackPopupMenuEx(menu,flags,x,y,owner,parameters);
}
static bool MenuOrigin() {
    return enabled.load() && !drawingTheme && menuDepth && ExplorerWindow(menuOwner);
}
static bool MenuDC(HDC dc) {
    if(!MenuOrigin())return false;
    HWND owner=WindowFromDC(dc);
    if(!owner)return true; // Native popup rendering also uses ownerless memory DCs.
    wchar_t name[64]{};
    return ExplorerWindow(owner) || (GetClassNameW(owner,name,64) && _wcsicmp(name,L"#32768")==0);
}
static bool MenuClass(HTHEME theme) {
    wchar_t name[128]{};
    if(!themeClass || FAILED(themeClass(theme,name,128)))return false;
    const wchar_t* suffix=wcsrchr(name,L':');suffix=suffix?suffix+1:name;
    return _wcsicmp(suffix,L"Menu")==0;
}
// The exact recorded host uses part 27 for popup items. It is absent from the
// retained SDK's MENUPARTS enum; never assume it on a different executable.
static constexpr int hostPopupItem=27;
static bool MenuItem(int part) {return part==MENU_POPUPITEM || part==hostPopupItem;}
static bool MenuItemState(int state) {return state>=MPI_NORMAL && state<=MPI_DISABLEDHOT;}
static bool MenuPart(int part,int state) {
    if(MenuItem(part))return MenuItemState(state);
    if(part==MENU_POPUPBACKGROUND || part==MENU_POPUPBORDERS || part==MENU_POPUPGUTTER)return state==0;
    if(part==MENU_POPUPSEPARATOR)return state>=0 && state<=3;
    if(part==MENU_POPUPCHECK)return state>=MC_CHECKMARKNORMAL && state<=MC_BULLETDISABLED;
    if(part==MENU_POPUPCHECKBACKGROUND)return state>=MCB_DISABLED && state<=MCB_NORMAL;
    if(part==MENU_POPUPSUBMENU)return state==MSM_NORMAL || state==MSM_DISABLED;
    return false;
}
static COLORREF MenuText(int part,int state) {
    if((MenuItem(part) && (state==MPI_DISABLED || state==MPI_DISABLEDHOT))
       || (part==MENU_POPUPCHECK && (state==MC_CHECKMARKDISABLED || state==MC_BULLETDISABLED))
       || (part==MENU_POPUPSUBMENU && state==MSM_DISABLED))return disabled;
    return MenuItem(part) && state==MPI_HOT?menuHoverText:foreground;
}
static bool ExplorerDC(HDC dc,bool nonclientScrollbar=false) {
    HWND owner=WindowFromDC(dc);
    if(!enabled.load() || drawingTheme || HighContrast())return false;
    if(owner)return ExplorerWindow(owner);
    if(nonclientScrollbar && defaultWindow)return ExplorerWindow(defaultWindow);
    return !paintWindows.empty() && ExplorerWindow(paintWindows.back());
}
// The observed native filename editor is Edit inside CtrlNotifySink. Do not
// broaden this to arbitrary edit controls or infer a target from focus alone.
static bool RenameDC(HDC dc) {
    if(!enabled.load() || drawingTheme || HighContrast())return false;
    HWND window=WindowFromDC(dc);
    if(!window && !paintWindows.empty())window=paintWindows.back();
    wchar_t name[64]{},parent[64]{};
    return ExplorerWindow(window) && GetClassNameW(window,name,64)
        && _wcsicmp(name,L"Edit")==0 && GetClassNameW(GetParent(window),parent,64)
        && _wcsicmp(parent,L"CtrlNotifySink")==0;
}
// The native Edit paints its selected run with ExtTextOutW and a system
// highlight background set internally, bypassing exported SetBkColor. Replace
// only that observed selected-run color; preserve shaping, flags and DC state.
static BOOL WINAPI RenameTextHook(HDC dc,int x,int y,UINT options,const RECT* rect,
                                 LPCWSTR text,UINT count,const INT* spacing) {
    COLORREF oldBackground=GetBkColor(dc);
    if(!RenameDC(dc) || oldBackground!=GetSysColor(COLOR_HIGHLIGHT))
        return originalExtTextOut(dc,x,y,options,rect,text,count,spacing);
    int saved=SaveDC(dc);
    if(!saved)return originalExtTextOut(dc,x,y,options,rect,text,count,spacing);
    originalSetBkColor(dc,textSelection);
    originalSetTextColor(dc,textSelectionText);
    BOOL result=originalExtTextOut(dc,x,y,options,rect,text,count,spacing);
    RestoreDC(dc,saved);
    return result;
}
// Memory DCs have no WindowFromDC owner. Preserve nested paint scope per thread.
static HDC WINAPI BeginPaintHook(HWND window,LPPAINTSTRUCT paint) {
    HDC dc=originalBeginPaint(window,paint);
    if(dc) paintWindows.push_back(window);
    return dc;
}
static BOOL WINAPI EndPaintHook(HWND window,const PAINTSTRUCT* paint) {
    for(auto it=paintWindows.end();it!=paintWindows.begin();) { --it;if(*it==window) {paintWindows.erase(it);break;} }
    return originalEndPaint(window,paint);
}
static bool NativeClass(HTHEME theme) {
    wchar_t name[128]{};
    if(!themeClass || FAILED(themeClass(theme,name,128))) return false;
    const wchar_t* suffix=wcsrchr(name,L':');
    suffix=suffix?suffix+1:name;
    return _wcsicmp(suffix,L"ItemsView")==0 || _wcsicmp(suffix,L"ListView")==0
        || _wcsicmp(suffix,L"TreeView")==0 || _wcsicmp(suffix,L"Header")==0
        || _wcsicmp(suffix,L"ReadingPane")==0 || _wcsicmp(suffix,L"PreviewPane")==0
        || _wcsicmp(suffix,L"ScrollBar")==0 || _wcsicmp(suffix,L"CommandModule")==0
        || _wcsicmp(suffix,L"ShellStatusBarSeparator")==0;
}
static bool Gray(COLORREF color,int low,int high) {
    return GetRValue(color)==GetGValue(color) && GetGValue(color)==GetBValue(color)
        && GetRValue(color)>=low && GetRValue(color)<=high;
}
// The recorded navigation separator is a two-point horizontal Polyline in
// SysTreeView32, using the neutral 0x383838 solid pen. Preserve its native DPI
// width, extent and DC; tree branches, glyphs and unrelated controls pass through.
static BOOL WINAPI NavigationLineHook(HDC dc,const POINT* points,int count) {
    HWND window=WindowFromDC(dc);
    if(!window && !paintWindows.empty())window=paintWindows.back();
    wchar_t name[64]{};LOGPEN pen{};
    if(!points || count!=2 || points[0].y!=points[1].y
       || abs(points[1].x-points[0].x)<=16 || !ExplorerDC(dc)
       || !GetClassNameW(window,name,64) || _wcsicmp(name,L"SysTreeView32")!=0
       || GetObjectW(GetCurrentObject(dc,OBJ_PEN),sizeof(pen),&pen)!=sizeof(pen)
       || pen.lopnStyle!=PS_SOLID || pen.lopnColor!=RGB(56,56,56)
       || pen.lopnWidth.x<0 || pen.lopnWidth.x>4)return originalPolyline(dc,points,count);
    HPEN owned=CreatePen(pen.lopnStyle,pen.lopnWidth.x,border);
    if(!owned)return originalPolyline(dc,points,count);
    HGDIOBJ previous=SelectObject(dc,owned);
    if(!previous || previous==HGDI_ERROR){DeleteObject(owned);return originalPolyline(dc,points,count);}
    BOOL result=originalPolyline(dc,points,count);
    SelectObject(dc,previous);DeleteObject(owned);return result;
}
static int WINAPI FillRectHook(HDC dc,const RECT* rect,HBRUSH brush) {
    if(ExplorerDC(dc)) {
        LOGBRUSH data{};
        if(GetObjectW(brush,sizeof(data),&data)==sizeof(data) && data.lbStyle==BS_SOLID && Gray(data.lbColor,0,255)) {
            if(Gray(data.lbColor,0,48))brush=backgroundBrush;
            else {
                HBRUSH tinted=CreateSolidBrush(Gray(data.lbColor,49,191)?border:foreground);
                if(tinted){int result=originalFillRect(dc,rect,tinted);DeleteObject(tinted);return result;}
            }
        }
    }
    return originalFillRect(dc,rect,brush);
}
static BOOL WINAPI PatBltHook(HDC dc,int x,int y,int width,int height,DWORD operation) {
    // The observed marquee fill selects a cached COLOR_HOTLIGHT system brush;
    // GetSysColor alone cannot recolor it. Replace that exact brush only while
    // this control paints its background, then restore the caller's DC brush.
    if(operation==PATCOPY && enabled.load() && !drawingTheme && !HighContrast()
       && marqueePaint==MarqueePaint::Background
       && GetCurrentObject(dc,OBJ_BRUSH)==GetSysColorBrush(COLOR_HOTLIGHT)) {
        HBRUSH brush=CreateSolidBrush(marquee);
        if(brush) {
            HGDIOBJ before=SelectObject(dc,brush);
            if(before && before!=HGDI_ERROR) {
                BOOL result=originalPatBlt(dc,x,y,width,height,operation);
                SelectObject(dc,before);DeleteObject(brush);return result;
            }
            DeleteObject(brush);
        }
        return originalPatBlt(dc,x,y,width,height,operation);
    }
    if(operation==PATCOPY && ExplorerDC(dc)) {
        LOGBRUSH data{};
        if(GetObjectW(GetCurrentObject(dc,OBJ_BRUSH),sizeof(data),&data)==sizeof(data) && data.lbStyle==BS_SOLID && Gray(data.lbColor,0,255)) {
            HBRUSH brush=CreateSolidBrush(Gray(data.lbColor,0,48)?background:scrollbar);
            if(brush){HGDIOBJ before=SelectObject(dc,brush);if(before && before!=HGDI_ERROR){BOOL result=originalPatBlt(dc,x,y,width,height,operation);SelectObject(dc,before);DeleteObject(brush);return result;}DeleteObject(brush);}
        }
    }
    return originalPatBlt(dc,x,y,width,height,operation);
}
static COLORREF WINAPI TextColorHook(HDC dc,COLORREF color) {
    if(ExplorerDC(dc)) {
        if(Gray(color,192,255))color=foreground;
        else if(Gray(color,128,191))color=disabled;
    }
    return originalSetTextColor(dc,color);
}
static COLORREF WINAPI BkColorHook(HDC dc,COLORREF color) {
    if(Gray(color,16,48) && ExplorerDC(dc)) color=background;
    return originalSetBkColor(dc,color);
}
static HRESULT WINAPI ThemeColorHook(HTHEME theme,int part,int state,int property,COLORREF* color) {
    HRESULT result=originalGetThemeColor(theme,part,state,property,color);
    if(FAILED(result) || !color)return result;
    if(MenuClass(theme) && enabled.load() && !drawingTheme && !HighContrast()) {
        // Explorer queries the popup background before TrackPopupMenu. Admit
        // only that background property, on the active window of this thread.
        // An explicit nested menu owner always takes precedence, even if it is
        // unrelated. No text/border/glyph query receives this early fallback.
        bool earlyBackground=!menuDepth && part==MENU_POPUPBACKGROUND && state==0
            && property==TMT_FILLCOLOR && ExplorerWindow(GetActiveWindow());
        if(MenuPart(part,state) && (MenuOrigin() || earlyBackground) && Gray(*color,0,255)) {
            if(property==TMT_TEXTCOLOR && (MenuItem(part) || part==MENU_POPUPCHECK || part==MENU_POPUPSUBMENU))*color=MenuText(part,state);
            // The recorded host queries its popup frame through FILLCOLORHINT
            // (not FILLCOLOR). Admit that observed hint only for the frame part.
            else if(property==TMT_FILLCOLOR || property==TMT_BORDERCOLOR
                    || (part==MENU_POPUPBORDERS && property==TMT_FILLCOLORHINT)) {
                if(part==MENU_POPUPBORDERS)*color=menuBorder;
                else if(part==MENU_POPUPSEPARATOR)*color=border;
                else if(part==MENU_POPUPBACKGROUND || part==MENU_POPUPGUTTER || MenuItem(part))
                    *color=MenuItem(part) && state==MPI_HOT?menuHover:background;
            }
        }
        return result;
    }
    if(NativeClass(theme) && enabled.load() && !drawingTheme && !paintWindows.empty() && ExplorerWindow(paintWindows.back())) {
        if(property==TMT_FILLCOLOR && Gray(*color,16,48)) *color=background;
        if(property==TMT_TEXTCOLOR && Gray(*color,192,255)) *color=foreground;
    }
    return result;
}
static HRESULT WINAPI TextExHook(HTHEME theme,HDC dc,int part,int state,LPCWSTR text,
    int count,DWORD flags,LPRECT rect,const DTTOPTS* options) {
    bool menu=MenuClass(theme) && MenuPart(part,state) && MenuDC(dc);
    if((menu || (NativeClass(theme) && ExplorerDC(dc))) && (!options || options->dwSize==sizeof(DTTOPTS))) {
        DTTOPTS custom{};
        if(options) custom=*options;
        custom.dwSize=sizeof(custom);
        COLORREF previous{};
        HRESULT colorResult=S_OK;
        if(options && (options->dwFlags&DTT_TEXTCOLOR))previous=options->crText;
        else colorResult=originalGetThemeColor(theme,part,state,TMT_TEXTCOLOR,&previous);
        if(SUCCEEDED(colorResult) && Gray(previous,menu?0:192,255)) {
            custom.dwFlags|=DTT_TEXTCOLOR;
            custom.crText=menu?MenuText(part,state):foreground;
            return originalDrawThemeTextEx(theme,dc,part,state,text,count,flags,rect,&custom);
        }
    }
    return originalDrawThemeTextEx(theme,dc,part,state,text,count,flags,rect,options);
}
// Render native theme geometry into an isolated DIB, recoloring only neutral
// pixels. No screen capture, application images, font geometry or input changes.
// Preserve clipping and DC state; unsupported transforms/options pass through.
static HRESULT PaintTheme(HTHEME theme,HDC dc,int part,int state,const RECT* rect,
                          const RECT* clip,const DTBGOPTS* options,bool extended) {
    auto original=[&](HDC target){return extended?originalDrawThemeBackgroundEx(theme,target,part,state,rect,options):originalDrawThemeBackground(theme,target,part,state,rect,clip);};
    wchar_t themeName[128]{};
    if(themeClass)themeClass(theme,themeName,128);
    const wchar_t* themeKind=wcsrchr(themeName,L':');themeKind=themeKind?themeKind+1:themeName;
    bool nonclientScrollbar=_wcsicmp(themeKind,L"ScrollBar")==0;
    bool menu=MenuClass(theme);
    bool admitted=menu?(MenuPart(part,state) && MenuDC(dc)):(NativeClass(theme) && ExplorerDC(dc,nonclientScrollbar));
    if(drawingTheme || !rect || !admitted || GetMapMode(dc)!=MM_TEXT || GetLayout(dc)!=0
       || (options && (options->dwSize!=sizeof(DTBGOPTS) || (options->dwFlags&~DTBG_CLIPRECT))))return original(dc);
    int width=rect->right-rect->left,height=rect->bottom-rect->top;
    if(width<=0 || height<=0 || width>8192 || height>4096 || (long long)width*height>8388608)return original(dc);
    HDC buffer=CreateCompatibleDC(dc);if(!buffer)return original(dc);
    BITMAPINFO info{};info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);info.bmiHeader.biWidth=width;info.bmiHeader.biHeight=-height;
    info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;info.bmiHeader.biCompression=BI_RGB;
    DWORD* pixels=nullptr;HBITMAP bitmap=CreateDIBSection(dc,&info,DIB_RGB_COLORS,(void**)&pixels,nullptr,0);
    if(!bitmap){DeleteDC(buffer);return original(dc);}
    HGDIOBJ previous=SelectObject(buffer,bitmap);
    if(!previous || previous==HGDI_ERROR){DeleteObject(bitmap);DeleteDC(buffer);return original(dc);}
    // Start with the destination so transparent glyphs retain their backdrop.
    if(!BitBlt(buffer,0,0,width,height,dc,rect->left,rect->top,SRCCOPY)){SelectObject(buffer,previous);DeleteObject(bitmap);DeleteDC(buffer);return original(dc);}
    SetViewportOrgEx(buffer,-rect->left,-rect->top,nullptr);
    drawingTheme=true;HRESULT result=original(buffer);drawingTheme=false;
    GdiFlush();
    wchar_t name[128]{};themeClass(theme,name,128);const wchar_t* kind=wcsrchr(name,L':');kind=kind?kind+1:name;
    bool scroll=_wcsicmp(kind,L"ScrollBar")==0;
    bool tree=_wcsicmp(kind,L"TreeView")==0;
    bool item=tree || _wcsicmp(kind,L"ItemsView")==0 || _wcsicmp(kind,L"ListView")==0;
    COLORREF fill=hover;
    if(item && part==1) {
        if(state==3 || state==6)fill=selected;
        else if(state==5)fill=inactive;
    }
    if(scroll)fill=(state==2 || state==3)?scrollbarHover:scrollbar;
    if(SUCCEEDED(result)) {
        for(int i=0;i<width*height;i++) {
            DWORD pixel=pixels[i];BYTE blue=pixel&255,green=(pixel>>8)&255,red=(pixel>>16)&255;
            // The recorded host paints selected outlines through ListView
            // and TreeView part 1/state 3. Both live offscreen traces identify
            // the same three blue perimeter colors, including corner blends.
            // Keep the conversion at the two-pixel perimeter: interior images,
            // unknown border colors and every other part/state survive.
            bool focusEdge=(tree || _wcsicmp(kind,L"ListView")==0) && part==1 && state==3
                && (i%width<2 || i%width>=width-2 || i/width<2 || i/width>=height-2);
            DWORD rgb=pixel&0xffffff;
            if(focusEdge && (rgb==0x60cdff || rgb==0x58bdeb || rgb==0x214657)) {
                auto blend=[&](BYTE channel){return (channel*blue+127)/255;};
                pixels[i]=(pixel&0xff000000)|(blend(GetRValue(focusRing))<<16)
                    |(blend(GetGValue(focusRing))<<8)|blend(GetBValue(focusRing));
                continue;
            }
            if(red!=green || green!=blue)continue;
            COLORREF color=red<=48?background:red<160?fill:foreground;
            if(menu) {
                if(part==MENU_POPUPBORDERS)color=red<=48?background:menuBorder;
                else if(part==MENU_POPUPSEPARATOR)color=red<=48?background:border;
                else if(part==MENU_POPUPCHECK || part==MENU_POPUPSUBMENU)color=red<=48?background:MenuText(part,state);
                else color=MenuItem(part) && state==MPI_HOT?menuHover:background;
            }
            pixels[i]=(pixel&0xff000000)|(GetRValue(color)<<16)|(GetGValue(color)<<8)|GetBValue(color);
        }
        int saved=SaveDC(dc);
        if(saved) {
            if(clip)IntersectClipRect(dc,clip->left,clip->top,clip->right,clip->bottom);
            if(options && (options->dwFlags&DTBG_CLIPRECT))IntersectClipRect(dc,options->rcClip.left,options->rcClip.top,options->rcClip.right,options->rcClip.bottom);
            if(!BitBlt(dc,rect->left,rect->top,width,height,buffer,rect->left,rect->top,SRCCOPY))result=E_FAIL;
            RestoreDC(dc,saved);
        } else result=E_FAIL;
    }
    SelectObject(buffer,previous);DeleteObject(bitmap);DeleteDC(buffer);
    return FAILED(result)?original(dc):result;
}
static HRESULT WINAPI BackgroundHook(HTHEME theme,HDC dc,int part,int state,const RECT* rect,const RECT* clip) {
    return PaintTheme(theme,dc,part,state,rect,clip,nullptr,false);
}
static HRESULT WINAPI BackgroundExHook(HTHEME theme,HDC dc,int part,int state,const RECT* rect,const DTBGOPTS* options) {
    return PaintTheme(theme,dc,part,state,rect,nullptr,options,true);
}
static BOOL CALLBACK RepaintChild(HWND window,LPARAM) {
    RedrawWindow(window,nullptr,nullptr,RDW_INVALIDATE|RDW_ERASE|RDW_FRAME);return TRUE;
}
static BOOL CALLBACK RepaintFolder(HWND window,LPARAM) {
    DWORD process=0;GetWindowThreadProcessId(window,&process);
    if(process==GetCurrentProcessId() && ExplorerWindow(window)) {RepaintChild(window,0);EnumChildWindows(window,RepaintChild,0);}return TRUE;
}
static bool ReadColor(PCWSTR key,COLORREF* output) {
    PCWSTR input=Wh_GetStringSetting(key);
    unsigned r,g,b;int used=0;
    bool valid=input && swscanf(input,L"#%2x%2x%2x%n",&r,&g,&b,&used)==3 && used==7 && input[7]==0;
    if(valid) *output=RGB(r,g,b);
    Wh_FreeStringSetting(input);
    return valid;
}
static bool ReadMarquee() {
    PCWSTR input=Wh_GetStringSetting(L"marquee");unsigned a,r,g,b;int used=0;
    bool valid=input && wcslen(input)==9 && swscanf(input,L"#%2x%2x%2x%2x%n",&a,&r,&g,&b,&used)==4 && used==9;
    if(valid){marquee=RGB(r,g,b);marqueeAlpha=(BYTE)a;}
    Wh_FreeStringSetting(input);
    return valid && ReadColor(L"marqueeBorder",&marqueeBorder);
}
// Refuse unknown fixed executable versions even if descriptive metadata matches.
BOOL Wh_ModInit() {

    if(HighContrast()) {return FALSE;}
    if(!ReadColor(L"background",&background) || !ReadColor(L"foreground",&foreground) || !ReadColor(L"hover",&hover) || !ReadColor(L"selected",&selected) || !ReadColor(L"inactive",&inactive) || !ReadColor(L"border",&border) || !ReadColor(L"scrollbar",&scrollbar) || !ReadColor(L"scrollbarHover",&scrollbarHover) || !ReadColor(L"disabled",&disabled) || !ReadColor(L"textSelection",&textSelection) || !ReadColor(L"textSelectionText",&textSelectionText) || !ReadColor(L"focusRing",&focusRing) || !ReadColor(L"menuHover",&menuHover) || !ReadColor(L"menuHoverText",&menuHoverText) || !ReadColor(L"menuBorder",&menuBorder)) {return FALSE;}
    wchar_t executable[MAX_PATH]{};
    if(!GetModuleFileNameW(nullptr,executable,MAX_PATH)) return FALSE;
    DWORD ignored=0,size=GetFileVersionInfoSizeW(executable,&ignored);
    std::vector<BYTE> bytes(size);
    VS_FIXEDFILEINFO* version=nullptr;UINT length=0;
    if(!size || !GetFileVersionInfoW(executable,0,size,bytes.data()) || !VerQueryValueW(bytes.data(),L"\\",(void**)&version,&length)
        || length<sizeof(*version) || version->dwFileVersionMS!=MAKELONG(0,10) || version->dwFileVersionLS!=MAKELONG(9549,26100)) {return FALSE;}
    themeClass=(ThemeClassFn)GetProcAddress(GetModuleHandleW(L"uxtheme.dll"),MAKEINTRESOURCEA(74));
    if(!themeClass) {return FALSE;}
    if(!ReadColor(L"pin",&pin) || !ReadMarquee() || !InitMarquee() || !InitNavigationPin())return FALSE;
    COLORREF folderFill,folderEdge;
    if(!ReadColor(L"folderFill",&folderFill)||!ReadColor(L"folderEdge",&folderEdge)||!FolderGlyph::Init(folderFill,folderEdge))return FALSE;
    if(!FolderBitmap::Init()){FolderGlyph::Uninit();return FALSE;}
    backgroundBrush=CreateSolidBrush(background);
    if(!backgroundBrush){FolderBitmap::Uninit();FolderGlyph::Uninit();return FALSE;}
    bool hooked=Wh_SetFunctionHook((void*)DwmSetWindowAttribute,(void*)DwmAttributeHook,(void**)&originalDwmSetWindowAttribute)
        && Wh_SetFunctionHook((void*)CreateWindowExW,(void*)CreateWindowHook,(void**)&originalCreateWindowEx)
        && Wh_SetFunctionHook((void*)DestroyWindow,(void*)DestroyWindowHook,(void**)&originalDestroyWindow)
        && Wh_SetFunctionHook((void*)TrackPopupMenu,(void*)PopupHook,(void**)&originalTrackPopupMenu)
        && Wh_SetFunctionHook((void*)TrackPopupMenuEx,(void*)PopupExHook,(void**)&originalTrackPopupMenuEx)
        && Wh_SetFunctionHook((void*)FillRect,(void*)FillRectHook,(void**)&originalFillRect)
        && Wh_SetFunctionHook((void*)SetTextColor,(void*)TextColorHook,(void**)&originalSetTextColor)
        && Wh_SetFunctionHook((void*)PatBlt,(void*)PatBltHook,(void**)&originalPatBlt)
        && Wh_SetFunctionHook((void*)Polyline,(void*)NavigationLineHook,(void**)&originalPolyline)
        && Wh_SetFunctionHook((void*)SetBkColor,(void*)BkColorHook,(void**)&originalSetBkColor)
        && Wh_SetFunctionHook((void*)ExtTextOutW,(void*)RenameTextHook,(void**)&originalExtTextOut)
        && Wh_SetFunctionHook((void*)GetThemeColor,(void*)ThemeColorHook,(void**)&originalGetThemeColor)
        && Wh_SetFunctionHook((void*)DrawThemeTextEx,(void*)TextExHook,(void**)&originalDrawThemeTextEx)
        && Wh_SetFunctionHook((void*)BeginPaint,(void*)BeginPaintHook,(void**)&originalBeginPaint)
        && Wh_SetFunctionHook((void*)EndPaint,(void*)EndPaintHook,(void**)&originalEndPaint)
        && Wh_SetFunctionHook((void*)DefWindowProcW,(void*)DefaultWindowHook,(void**)&originalDefWindowProc)
        && Wh_SetFunctionHook((void*)SetScrollInfo,(void*)ScrollInfoHook,(void**)&originalSetScrollInfo)
        && Wh_SetFunctionHook((void*)DrawThemeBackground,(void*)BackgroundHook,(void**)&originalDrawThemeBackground)
        && Wh_SetFunctionHook((void*)DrawThemeBackgroundEx,(void*)BackgroundExHook,(void**)&originalDrawThemeBackgroundEx);

    if(!hooked) {DeleteObject(backgroundBrush);backgroundBrush=nullptr;FolderBitmap::Uninit();FolderGlyph::Uninit();}
    enabled.store(hooked);
    return hooked;
}
void Wh_ModAfterInit() {EnumWindows(RefreshFolderCaption,0);EnumWindows(RepaintFolder,0);}
void Wh_ModBeforeUninit() { enabled.store(false);RestoreCaptions(); }
void Wh_ModUninit() { FolderBitmap::Uninit();FolderGlyph::Uninit();if(backgroundBrush) {DeleteObject(backgroundBrush);backgroundBrush=nullptr;} EnumWindows(RepaintFolder,0); }
