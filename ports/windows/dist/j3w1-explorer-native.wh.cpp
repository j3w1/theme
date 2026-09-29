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
*/
// ==/WindhawkModSettings==
#include <windows.h>
#include <uxtheme.h>
#include <vssym32.h>
#include <vector>
#include <cwchar>
#include <atomic>

static COLORREF background, foreground, hover, selected, inactive, border, scrollbar, scrollbarHover, disabled;
static HBRUSH backgroundBrush;
using ThemeClassFn=HRESULT(WINAPI*)(HTHEME,LPWSTR,int);
static ThemeClassFn themeClass;
static decltype(&FillRect) originalFillRect;
static decltype(&SetTextColor) originalSetTextColor;
static decltype(&SetBkColor) originalSetBkColor;
static decltype(&PatBlt) originalPatBlt;
static decltype(&GetThemeColor) originalGetThemeColor;
static decltype(&DrawThemeTextEx) originalDrawThemeTextEx;
static decltype(&BeginPaint) originalBeginPaint;
static decltype(&EndPaint) originalEndPaint;
static decltype(&DrawThemeBackground) originalDrawThemeBackground;
static decltype(&DrawThemeBackgroundEx) originalDrawThemeBackgroundEx;
static thread_local std::vector<HWND> paintWindows;
static std::atomic<bool> enabled{false};
static thread_local bool drawingTheme=false;

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
static bool ExplorerDC(HDC dc) {
    HWND owner=WindowFromDC(dc);
    return enabled.load() && !drawingTheme && !HighContrast() && (owner?ExplorerWindow(owner):(!paintWindows.empty() && ExplorerWindow(paintWindows.back())));
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
    if(SUCCEEDED(result) && color && NativeClass(theme) && enabled.load() && !drawingTheme && !paintWindows.empty() && ExplorerWindow(paintWindows.back())) {
        if(property==TMT_FILLCOLOR && Gray(*color,16,48)) *color=background;
        if(property==TMT_TEXTCOLOR && Gray(*color,192,255)) *color=foreground;
    }
    return result;
}
static HRESULT WINAPI TextExHook(HTHEME theme,HDC dc,int part,int state,LPCWSTR text,
    int count,DWORD flags,LPRECT rect,const DTTOPTS* options) {
    if(NativeClass(theme) && ExplorerDC(dc) && (!options || options->dwSize==sizeof(DTTOPTS))) {
        DTTOPTS custom{};
        if(options) custom=*options;
        custom.dwSize=sizeof(custom);
        COLORREF previous{};
        HRESULT colorResult=S_OK;
        if(options && (options->dwFlags&DTT_TEXTCOLOR))previous=options->crText;
        else colorResult=originalGetThemeColor(theme,part,state,TMT_TEXTCOLOR,&previous);
        if(SUCCEEDED(colorResult) && Gray(previous,192,255)) {
            custom.dwFlags|=DTT_TEXTCOLOR;
            custom.crText=foreground;
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
    if(drawingTheme || !rect || !ExplorerDC(dc) || !NativeClass(theme) || GetMapMode(dc)!=MM_TEXT || GetLayout(dc)!=0
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
            if(red!=green || green!=blue)continue;
            COLORREF color=red<=48?background:red<160?fill:foreground;
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
    if(!ReadColor(L"background",&background) || !ReadColor(L"foreground",&foreground) || !ReadColor(L"hover",&hover) || !ReadColor(L"selected",&selected) || !ReadColor(L"inactive",&inactive) || !ReadColor(L"border",&border) || !ReadColor(L"scrollbar",&scrollbar) || !ReadColor(L"scrollbarHover",&scrollbarHover) || !ReadColor(L"disabled",&disabled)) {return FALSE;}
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
    bool hooked=Wh_SetFunctionHook((void*)FillRect,(void*)FillRectHook,(void**)&originalFillRect)
        && Wh_SetFunctionHook((void*)SetTextColor,(void*)TextColorHook,(void**)&originalSetTextColor)
        && Wh_SetFunctionHook((void*)PatBlt,(void*)PatBltHook,(void**)&originalPatBlt)
        && Wh_SetFunctionHook((void*)SetBkColor,(void*)BkColorHook,(void**)&originalSetBkColor)
        && Wh_SetFunctionHook((void*)GetThemeColor,(void*)ThemeColorHook,(void**)&originalGetThemeColor)
        && Wh_SetFunctionHook((void*)DrawThemeTextEx,(void*)TextExHook,(void**)&originalDrawThemeTextEx)
        && Wh_SetFunctionHook((void*)BeginPaint,(void*)BeginPaintHook,(void**)&originalBeginPaint)
        && Wh_SetFunctionHook((void*)EndPaint,(void*)EndPaintHook,(void**)&originalEndPaint)
        && Wh_SetFunctionHook((void*)DrawThemeBackground,(void*)BackgroundHook,(void**)&originalDrawThemeBackground)
        && Wh_SetFunctionHook((void*)DrawThemeBackgroundEx,(void*)BackgroundExHook,(void**)&originalDrawThemeBackgroundEx);

    if(!hooked) {DeleteObject(backgroundBrush);backgroundBrush=nullptr;}
    enabled.store(hooked);
    return hooked;
}
void Wh_ModAfterInit() {EnumWindows(RepaintFolder,0);}
void Wh_ModBeforeUninit() { enabled.store(false); }
void Wh_ModUninit() { if(backgroundBrush) {DeleteObject(backgroundBrush);backgroundBrush=nullptr;} EnumWindows(RepaintFolder,0); }
