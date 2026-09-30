// Native regression: hidden windows and offscreen GDI; no desktop input/capture.
#include <windows.h>
#include <cassert>
#include <cstdio>
static HWND fixtureActiveWindow=nullptr;
static bool fixtureHighContrast=false;
static HWND FixtureGetActiveWindow(){return fixtureActiveWindow;}
static BOOL WINAPI FixtureSystemParametersInfo(UINT action,UINT size,PVOID value,UINT flags){
    if(action==SPI_GETHIGHCONTRAST){auto contrast=static_cast<HIGHCONTRASTW*>(value);contrast->dwFlags=fixtureHighContrast?HCF_HIGHCONTRASTON:0;return TRUE;}
    return SystemParametersInfoW(action,size,value,flags);
}
#define GetActiveWindow FixtureGetActiveWindow
#define SystemParametersInfoW FixtureSystemParametersInfo
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static PCWSTR Wh_GetStringSetting(PCWSTR){return L"#000000";}
static void Wh_FreeStringSetting(PCWSTR){}
#include "../ports/windows/dist/j3w1-explorer-native.wh.cpp"
static HWND Window(const wchar_t* name,HWND parent=nullptr,bool builtin=false){
    if(!builtin){WNDCLASSW c{};c.lpfnWndProc=DefWindowProcW;c.hInstance=GetModuleHandleW(nullptr);c.lpszClassName=name;
        assert(RegisterClassW(&c)||GetLastError()==ERROR_CLASS_ALREADY_EXISTS);}
    HWND w=CreateWindowExW(0,name,L"",parent?WS_CHILD:0,0,0,32,32,parent,nullptr,GetModuleHandleW(nullptr),nullptr);assert(w);return w;
}
static HDC target;
static HWND expectedWindow;
static LPCSCROLLINFO expectedInfo;
static int calls;
static int WINAPI ScrollPaint(HWND window,int bar,LPCSCROLLINFO info,BOOL redraw){
    assert(window==expectedWindow && bar==SB_VERT && info==expectedInfo && redraw==TRUE);calls++;
    RECT rect{0,0,32,32},clip{0,0,16,32};
    assert(SUCCEEDED(BackgroundHook(nullptr,target,SBP_THUMBBTNVERT,SCRBS_NORMAL,&rect,&clip)));
    return 17;
}
int main(){
    assert(!HighContrast());HWND folder=Window(L"CabinetWClass"),unrelated=Window(L"OtherApplication");
    HWND sink=Window(L"CtrlNotifySink",folder),edit=Window(L"Edit",sink,true),otherEdit=Window(L"Edit",folder,true);
    target=CreateCompatibleDC(nullptr);assert(target);
    BITMAPINFO info{};info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);info.bmiHeader.biWidth=32;info.bmiHeader.biHeight=-32;info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;
    void* pixels=nullptr;HBITMAP bitmap=CreateDIBSection(target,&info,DIB_RGB_COLORS,&pixels,nullptr,0);assert(bitmap);HGDIOBJ old=SelectObject(target,bitmap);
    RECT rect{0,0,32,32};HBRUSH black=CreateSolidBrush(RGB(0,0,0));
    enabled=true;background=RGB(0,0,0);scrollbar=RGB(42,1,0);foreground=RGB(233,148,153);
    textSelection=RGB(145,20,16);textSelectionText=RGB(244,238,238);
    originalSetBkColor=SetBkColor;originalSetTextColor=SetTextColor;originalExtTextOut=ExtTextOutW;
    originalSetScrollInfo=ScrollPaint;
    themeClass=[](HTHEME,LPWSTR name,int size)->HRESULT{wcscpy_s(name,size,L"ScrollBar");return S_OK;};
    originalDrawThemeBackground=[](HTHEME,HDC dc,int,int,const RECT* r,const RECT*)->HRESULT{HBRUSH gray=CreateSolidBrush(RGB(128,128,128));FillRect(dc,r,gray);DeleteObject(gray);return S_OK;};
    SCROLLINFO scrollInfo{sizeof(SCROLLINFO),SIF_POS,0,0,0,7,0};expectedInfo=&scrollInfo;expectedWindow=folder;
    FillRect(target,&rect,black);assert(ScrollInfoHook(folder,SB_VERT,&scrollInfo,TRUE)==17);assert(calls==1);
    assert(GetPixel(target,4,4)==scrollbar);assert(GetPixel(target,20,4)==background);assert(scrollInfo.nPos==7);
    assert(!ExplorerDC(target,true));
    {DefaultPaintScope outer(folder);expectedWindow=unrelated;
        ScrollInfoHook(unrelated,SB_VERT,&scrollInfo,TRUE);assert(GetPixel(target,4,4)==RGB(128,128,128));assert(ExplorerDC(target,true));}
    assert(!ExplorerDC(target,true));
    expectedWindow=folder;enabled=false;ScrollInfoHook(folder,SB_VERT,&scrollInfo,TRUE);assert(GetPixel(target,4,4)==RGB(128,128,128));enabled=true;
    paintWindows.push_back(edit);assert(RenameDC(target));
    SetBkColor(target,GetSysColor(COLOR_HIGHLIGHT));SetTextColor(target,foreground);
    RECT selectedRect{0,0,16,32};const wchar_t* text=L"A";
    assert(RenameTextHook(target,4,4,ETO_OPAQUE|ETO_CLIPPED,&selectedRect,text,1,nullptr));
    assert(GetPixel(target,1,1)==textSelection);assert(GetBkColor(target)==GetSysColor(COLOR_HIGHLIGHT));assert(GetTextColor(target)==foreground);
    SetBkColor(target,RGB(5,40,100));RenameTextHook(target,4,4,ETO_OPAQUE,&selectedRect,L"",0,nullptr);assert(GetPixel(target,1,1)==RGB(5,40,100));
    paintWindows.push_back(otherEdit);assert(!RenameDC(target));SetBkColor(target,GetSysColor(COLOR_HIGHLIGHT));
    RenameTextHook(target,4,4,ETO_OPAQUE,&selectedRect,L"",0,nullptr);assert(GetPixel(target,1,1)==GetSysColor(COLOR_HIGHLIGHT));paintWindows.pop_back();
    enabled=false;RenameTextHook(target,4,4,ETO_OPAQUE,&selectedRect,L"",0,nullptr);assert(GetPixel(target,1,1)==GetSysColor(COLOR_HIGHLIGHT));enabled=true;
    HDC other=GetDC(unrelated);assert(!RenameDC(other));ReleaseDC(unrelated,other);
    // Reproduce the live ListView selected-row border, its antialiased corners,
    // and an identically colored interior image. Only the border may change.
    paintWindows.clear();paintWindows.push_back(folder);focusRing=RGB(229,57,53);
    themeClass=[](HTHEME,LPWSTR name,int size)->HRESULT{wcscpy_s(name,size,L"ListView");return S_OK;};
    originalDrawThemeBackground=[](HTHEME,HDC dc,int,int,const RECT*,const RECT*)->HRESULT{
        SetPixel(dc,0,5,RGB(96,205,255));SetPixel(dc,1,1,RGB(88,189,235));
        SetPixel(dc,0,1,RGB(33,70,87));SetPixel(dc,5,5,RGB(96,205,255));
        SetPixel(dc,0,8,RGB(0,120,215));return S_OK;};
    FillRect(target,&rect,black);POINT originBefore{};GetViewportOrgEx(target,&originBefore);
    assert(SUCCEEDED(BackgroundHook(nullptr,target,1,3,&rect,nullptr)));
    assert(GetPixel(target,0,5)==focusRing);assert(GetPixel(target,1,1)==RGB(211,53,49));
    assert(GetPixel(target,0,1)==RGB(78,19,18));assert(GetPixel(target,5,5)==RGB(96,205,255));
    assert(GetPixel(target,0,8)==RGB(0,120,215));POINT originAfter{};GetViewportOrgEx(target,&originAfter);
    assert(originBefore.x==originAfter.x && originBefore.y==originAfter.y);
    assert(SUCCEEDED(BackgroundHook(nullptr,target,1,6,&rect,nullptr)));assert(GetPixel(target,0,5)==RGB(96,205,255));
    RECT focusClip{2,2,30,30};assert(SUCCEEDED(BackgroundHook(nullptr,target,1,3,&rect,&focusClip)));
    assert(GetPixel(target,0,5)==RGB(96,205,255));
    enabled=false;assert(SUCCEEDED(BackgroundHook(nullptr,target,1,3,&rect,nullptr)));assert(GetPixel(target,0,5)==RGB(96,205,255));enabled=true;
    // Menu popup regressions use hidden owners and offscreen pixels. No live
    // menu is opened and no input, screen capture or accessibility setting changes.
    paintWindows.clear();menuHover=RGB(50,17,16);menuHoverText=RGB(240,169,173);
    menuBorder=RGB(207,137,133);border=RGB(43,14,13);disabled=RGB(138,85,89);
    themeClass=[](HTHEME,LPWSTR name,int size)->HRESULT{wcscpy_s(name,size,L"DarkMode::Menu");return S_OK;};
    originalDrawThemeBackground=[](HTHEME,HDC dc,int,int,const RECT* r,const RECT*)->HRESULT{
        HBRUSH gray=CreateSolidBrush(RGB(62,62,62));FillRect(dc,r,gray);DeleteObject(gray);
        SetPixel(dc,6,6,RGB(0,120,215));return S_OK;};
    originalDrawThemeBackgroundEx=[](HTHEME t,HDC dc,int p,int s,const RECT* r,const DTBGOPTS*)->HRESULT{
        return originalDrawThemeBackground(t,dc,p,s,r,nullptr);};
    assert(!MenuOrigin());assert(!MenuDC(target));
    {MenuPaintScope popup(sink);
        assert(MenuOrigin() && MenuDC(target));
        for(int state:{MPI_NORMAL,MPI_DISABLED,MPI_DISABLEDHOT}){
            assert(SUCCEEDED(BackgroundHook(nullptr,target,hostPopupItem,state,&rect,nullptr)));
            assert(GetPixel(target,2,2)==background);assert(GetPixel(target,6,6)==RGB(0,120,215));
        }
        assert(SUCCEEDED(BackgroundHook(nullptr,target,hostPopupItem,MPI_HOT,&rect,nullptr)));
        assert(GetPixel(target,2,2)==menuHover);
        assert(SUCCEEDED(BackgroundHook(nullptr,target,MENU_POPUPBORDERS,0,&rect,nullptr)));
        assert(GetPixel(target,2,2)==menuBorder);
        assert(SUCCEEDED(BackgroundHook(nullptr,target,MENU_POPUPSEPARATOR,3,&rect,nullptr)));
        assert(GetPixel(target,2,2)==border);
        FillRect(target,&rect,black);RECT menuClip{0,0,16,32};
        assert(SUCCEEDED(BackgroundHook(nullptr,target,hostPopupItem,MPI_HOT,&rect,&menuClip)));
        assert(GetPixel(target,2,2)==menuHover && GetPixel(target,20,2)==background);
        FillRect(target,&rect,black);DTBGOPTS drawOptions{sizeof(drawOptions),DTBG_CLIPRECT,menuClip};
        assert(SUCCEEDED(BackgroundExHook(nullptr,target,hostPopupItem,MPI_HOT,&rect,&drawOptions)));
        assert(GetPixel(target,2,2)==menuHover && GetPixel(target,20,2)==background);
        assert(SUCCEEDED(BackgroundHook(nullptr,target,1234,MPI_HOT,&rect,nullptr)));
        assert(GetPixel(target,2,2)==RGB(62,62,62));
        assert(SUCCEEDED(BackgroundHook(nullptr,target,hostPopupItem,99,&rect,nullptr)));
        assert(GetPixel(target,2,2)==RGB(62,62,62));
        {MenuPaintScope unrelatedMenu(unrelated);assert(!MenuOrigin());
            BackgroundHook(nullptr,target,hostPopupItem,MPI_HOT,&rect,nullptr);
            assert(GetPixel(target,2,2)==RGB(62,62,62));}
        assert(MenuOrigin());
        HDC unrelatedDC=GetDC(unrelated);assert(!MenuDC(unrelatedDC));ReleaseDC(unrelated,unrelatedDC);
        enabled=false;assert(!MenuDC(target));enabled=true;
        fixtureHighContrast=true;assert(!MenuDC(target));fixtureHighContrast=false;
    }
    assert(menuOwner==nullptr && menuDepth==0);
    // The exported APIs must forward every argument and their native result.
    static HWND expectedMenuOwner;expectedMenuOwner=sink;
    static HMENU expectedMenu=reinterpret_cast<HMENU>(1234);
    static RECT exclusion{1,2,3,4};static TPMPARAMS parameters{sizeof(parameters),exclusion};
    originalTrackPopupMenu=[](HMENU menu,UINT flags,int x,int y,int reserved,HWND owner,const RECT* exclude)->BOOL{
        assert(menu==expectedMenu && flags==(TPM_RETURNCMD|TPM_RIGHTBUTTON));
        assert(x==10 && y==20 && reserved==0 && owner==expectedMenuOwner && exclude==&exclusion);
        assert(MenuOrigin());{MenuPaintScope nested(nullptr);assert(!MenuOrigin());}assert(MenuOrigin());
        return 123;};
    assert(PopupHook(expectedMenu,TPM_RETURNCMD|TPM_RIGHTBUTTON,10,20,0,sink,&exclusion)==123);
    assert(menuDepth==0 && menuOwner==nullptr);
    originalTrackPopupMenuEx=[](HMENU menu,UINT flags,int x,int y,HWND owner,LPTPMPARAMS value)->BOOL{
        assert(menu==expectedMenu && flags==TPM_RETURNCMD && x==10 && y==20 && owner==expectedMenuOwner && value==&parameters);
        assert(MenuOrigin());return 321;};
    assert(PopupExHook(expectedMenu,TPM_RETURNCMD,10,20,sink,&parameters)==321);
    assert(menuDepth==0 && menuOwner==nullptr);
    static COLORREF queryColor=RGB(44,44,44);static HRESULT queryResult=S_OK;
    originalGetThemeColor=[](HTHEME,int,int,int,COLORREF* color)->HRESULT{if(color)*color=queryColor;return queryResult;};
    COLORREF readback;fixtureActiveWindow=folder;
    ThemeColorHook(nullptr,MENU_POPUPBACKGROUND,0,TMT_FILLCOLOR,&readback);assert(readback==background);
    ThemeColorHook(nullptr,MENU_POPUPBORDERS,0,TMT_FILLCOLOR,&readback);assert(readback==queryColor);
    fixtureActiveWindow=unrelated;
    ThemeColorHook(nullptr,MENU_POPUPBACKGROUND,0,TMT_FILLCOLOR,&readback);assert(readback==queryColor);
    {MenuPaintScope popup(sink);
        ThemeColorHook(nullptr,MENU_POPUPBORDERS,0,TMT_FILLCOLOR,&readback);assert(readback==menuBorder);
        // Reproduce the live frame query: its color hint must be mapped without
        // changing an unknown hint, another part, or the native HRESULT.
        assert(ThemeColorHook(nullptr,MENU_POPUPBORDERS,0,TMT_FILLCOLORHINT,&readback)==S_OK);
        assert(readback==menuBorder);
        ThemeColorHook(nullptr,hostPopupItem,MPI_NORMAL,TMT_FILLCOLORHINT,&readback);assert(readback==queryColor);
        ThemeColorHook(nullptr,MENU_POPUPBORDERS,0,TMT_BORDERCOLORHINT,&readback);assert(readback==queryColor);
        fixtureHighContrast=true;
        ThemeColorHook(nullptr,MENU_POPUPBORDERS,0,TMT_FILLCOLORHINT,&readback);assert(readback==queryColor);
        fixtureHighContrast=false;
        {MenuPaintScope unrelatedMenu(unrelated);
            ThemeColorHook(nullptr,MENU_POPUPBORDERS,0,TMT_FILLCOLORHINT,&readback);assert(readback==queryColor);}
        enabled=false;
        ThemeColorHook(nullptr,MENU_POPUPBORDERS,0,TMT_FILLCOLORHINT,&readback);assert(readback==queryColor);
        enabled=true;
        queryColor=RGB(121,121,121);
        ThemeColorHook(nullptr,hostPopupItem,MPI_DISABLED,TMT_TEXTCOLOR,&readback);assert(readback==disabled);
        ThemeColorHook(nullptr,hostPopupItem,MPI_HOT,TMT_TEXTCOLOR,&readback);assert(readback==menuHoverText);
        queryColor=RGB(0,120,215);
        ThemeColorHook(nullptr,hostPopupItem,MPI_NORMAL,TMT_TEXTCOLOR,&readback);assert(readback==queryColor);
        queryResult=E_FAIL;assert(FAILED(ThemeColorHook(nullptr,hostPopupItem,MPI_NORMAL,TMT_TEXTCOLOR,&readback)));queryResult=S_OK;
        static COLORREF drawnText;static bool hasOptions;static DWORD drawnFlags;
        originalDrawThemeTextEx=[](HTHEME,HDC,int,int,LPCWSTR label,int count,DWORD flags,LPRECT r,const DTTOPTS* opts)->HRESULT{
            assert(count==1 && label[0]==L'A' && flags==DT_LEFT && r->right==32);
            hasOptions=opts!=nullptr;drawnText=opts?opts->crText:CLR_INVALID;drawnFlags=opts?opts->dwFlags:0;return 23;};
        queryColor=RGB(255,255,255);
        assert(TextExHook(nullptr,target,hostPopupItem,MPI_NORMAL,L"A",1,DT_LEFT,&rect,nullptr)==23);
        assert(drawnText==foreground && hasOptions);
        queryColor=RGB(121,121,121);
        DTTOPTS opts{};opts.dwSize=sizeof(opts);opts.dwFlags=DTT_TEXTCOLOR|DTT_GLOWSIZE;opts.crText=queryColor;opts.iGlowSize=4;
        DTTOPTS before=opts;
        TextExHook(nullptr,target,hostPopupItem,MPI_DISABLED,L"A",1,DT_LEFT,&rect,&opts);
        assert(drawnText==disabled && drawnFlags==opts.dwFlags && memcmp(&opts,&before,sizeof(opts))==0);
        opts.crText=RGB(0,120,215);TextExHook(nullptr,target,hostPopupItem,MPI_HOT,L"A",1,DT_LEFT,&rect,&opts);
        assert(drawnText==RGB(0,120,215));
        TextExHook(nullptr,target,hostPopupItem,99,L"A",1,DT_LEFT,&rect,nullptr);assert(!hasOptions);
        fixtureHighContrast=true;
        TextExHook(nullptr,target,hostPopupItem,MPI_NORMAL,L"A",1,DT_LEFT,&rect,nullptr);assert(!hasOptions);
        fixtureHighContrast=false;
        {MenuPaintScope unrelatedMenu(unrelated);fixtureActiveWindow=folder;queryColor=RGB(44,44,44);
            ThemeColorHook(nullptr,MENU_POPUPBACKGROUND,0,TMT_FILLCOLOR,&readback);assert(readback==queryColor);}
    }
    fixtureActiveWindow=nullptr;
    paintWindows.clear();assert(!RenameDC(target));DeleteObject(black);SelectObject(target,old);DeleteObject(bitmap);DeleteDC(target);
    DestroyWindow(edit);DestroyWindow(otherEdit);DestroyWindow(sink);DestroyWindow(folder);DestroyWindow(unrelated);
    puts("PASS: scoped menu pixels/text, disabled and hot states, clipping, nested and unrelated owners, high contrast, early-query boundaries and API arguments/return values; native focus border, antialiased corners, preserved interior/unknown colors, state and clipping; SetScrollInfo-owned native paint pixels, clipping, nested scope and argument/return preservation; native rename selection pixels and DC restoration; unknown color, other edit, unrelated owner and disabled passthrough");
}
