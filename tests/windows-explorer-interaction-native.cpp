// Native regression: hidden windows and offscreen GDI; no desktop input/capture.
#include <windows.h>
#include <cassert>
#include <cstdio>
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
    paintWindows.clear();assert(!RenameDC(target));DeleteObject(black);SelectObject(target,old);DeleteObject(bitmap);DeleteDC(target);
    DestroyWindow(edit);DestroyWindow(otherEdit);DestroyWindow(sink);DestroyWindow(folder);DestroyWindow(unrelated);
    puts("PASS: SetScrollInfo-owned native paint pixels, clipping, nested scope and argument/return preservation; native rename selection pixels and DC restoration; unknown color, other edit, unrelated owner and disabled passthrough");
}
