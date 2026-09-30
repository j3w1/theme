// ==WindhawkMod==
// @id j3w1-explorer-native
// @name j3w1 Explorer native colors
// @description Generated native Explorer canvas and text adapter; exact host only
// @version 1.0
// @author j3w1
// @include explorer.exe
// @architecture x86-64
// @compilerOptions -luxtheme -lgdi32 -luser32 -lversion
// ==/WindhawkMod==
// ==WindhawkModSettings==
/*
- background: "#000000"
- foreground: "#e99499"
- hover: "#1c0a09"
- selected: "#531310"
- inactive: "#420f0c"
- border: "#2b0e0d"
- scrollbar: "#420f0c"
- scrollbarHover: "#911410"
- disabled: "#8a5559"
- textSelection: "#911410"
- textSelectionText: "#f4eeee"
- focusRing: "#e53935"
- menuHover: "#630f0d"
- menuHoverText: "#f4eeee"
- menuBorder: "#e53935"
*/
// ==/WindhawkModSettings==
#include <windows.h>
#include <uxtheme.h>
#include <vssym32.h>
#include <vsstyle.h>
#include <vector>
#include <cwchar>
#include <atomic>

static COLORREF background, foreground, hover, selected, inactive, border, scrollbar, scrollbarHover, disabled;
static COLORREF textSelection, textSelectionText, focusRing, menuHover, menuHoverText, menuBorder;
static HBRUSH backgroundBrush;
using ThemeClassFn=HRESULT(WINAPI*)(HTHEME,LPWSTR,int);
static ThemeClassFn themeClass;
static decltype(&FillRect) originalFillRect;
static decltype(&SetTextColor) originalSetTextColor;
static decltype(&SetBkColor) originalSetBkColor;
static decltype(&ExtTextOutW) originalExtTextOut;
static decltype(&PatBlt) originalPatBlt;
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
            else if(property==TMT_FILLCOLOR || property==TMT_BORDERCOLOR) {
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
            // The exact host paints its selected-row outline in ListView 1/3,
            // independently of the native Edit selection. The live offscreen
            // trace identified these three border pixels (including corners).
            // Restrict the conversion to that draw's two-pixel perimeter: blue
            // file icons/content in the interior and every other state survive.
            bool focusEdge=_wcsicmp(kind,L"ListView")==0 && part==1 && state==3
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
    backgroundBrush=CreateSolidBrush(background);
    if(!backgroundBrush) return FALSE;
    bool hooked=Wh_SetFunctionHook((void*)TrackPopupMenu,(void*)PopupHook,(void**)&originalTrackPopupMenu)
        && Wh_SetFunctionHook((void*)TrackPopupMenuEx,(void*)PopupExHook,(void**)&originalTrackPopupMenuEx)
        && Wh_SetFunctionHook((void*)FillRect,(void*)FillRectHook,(void**)&originalFillRect)
        && Wh_SetFunctionHook((void*)SetTextColor,(void*)TextColorHook,(void**)&originalSetTextColor)
        && Wh_SetFunctionHook((void*)PatBlt,(void*)PatBltHook,(void**)&originalPatBlt)
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

    if(!hooked) {DeleteObject(backgroundBrush);backgroundBrush=nullptr;}
    enabled.store(hooked);
    return hooked;
}
void Wh_ModAfterInit() {EnumWindows(RepaintFolder,0);}
void Wh_ModBeforeUninit() { enabled.store(false); }
void Wh_ModUninit() { if(backgroundBrush) {DeleteObject(backgroundBrush);backgroundBrush=nullptr;} EnumWindows(RepaintFolder,0); }
