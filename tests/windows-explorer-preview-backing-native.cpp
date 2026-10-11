// Synthetic HWND/DC ownership and offscreen paint; no desktop input or content.
#include <windows.h>
#include <cassert>
#include <cstdio>
static HDC fixtureDC;
static HWND fixtureOwner,foreignProcess;
static bool highContrast=false,contrastFailure=false,fillFailure=false;
static unsigned nativeCalls=0;
static HWND WINAPI FixtureWindowFromDC(HDC dc){return dc==fixtureDC?fixtureOwner:WindowFromDC(dc);}
static DWORD WINAPI FixtureProcess(HWND window,LPDWORD process){
    DWORD thread=GetWindowThreadProcessId(window,process);
    if(process && window==foreignProcess)*process=GetCurrentProcessId()+1;
    return thread;
}
static BOOL WINAPI FixtureContrast(UINT action,UINT size,PVOID value,UINT flags){
    if(action==SPI_GETHIGHCONTRAST){if(contrastFailure)return FALSE;
        static_cast<HIGHCONTRASTW*>(value)->dwFlags=highContrast?HCF_HIGHCONTRASTON:0;return TRUE;}
    return SystemParametersInfoW(action,size,value,flags);
}
// A DIB stands in for the exact window DC so pixel and clipping results can be
// asserted without displaying a window. Every other memory DC remains rejected.
static DWORD WINAPI FixtureObjectType(HGDIOBJ object){return object==fixtureDC?OBJ_DC:GetObjectType(object);}
static int WINAPI FixtureFill(HDC dc,const RECT* rect,HBRUSH brush){return fillFailure?0:FillRect(dc,rect,brush);}
static LRESULT WINAPI FixtureDefault(HWND window,UINT message,WPARAM wParam,LPARAM lParam){
    ++nativeCalls;return DefWindowProcW(window,message,wParam,lParam);
}
#define WindowFromDC FixtureWindowFromDC
#define GetWindowThreadProcessId FixtureProcess
#define SystemParametersInfoW FixtureContrast
#define GetObjectType FixtureObjectType
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static PCWSTR Wh_GetStringSetting(PCWSTR){return L"#000000";}
static void Wh_FreeStringSetting(PCWSTR){}
#include "windows-windhawk-symbol-stubs.h"
#include "../ports/windows/dist/j3w1-explorer-native.wh.cpp"
#undef WindowFromDC
#undef GetWindowThreadProcessId
#undef SystemParametersInfoW
#undef GetObjectType
static HWND Window(PCWSTR name,HBRUSH brush,HWND parent=nullptr){
    WNDCLASSW wc{};wc.hInstance=GetModuleHandleW(nullptr);wc.lpszClassName=name;
    wc.lpfnWndProc=DefWindowProcW;wc.hbrBackground=brush;
    assert(RegisterClassW(&wc)||GetLastError()==ERROR_CLASS_ALREADY_EXISTS);
    HWND window=CreateWindowExW(0,name,L"",parent?WS_CHILD:0,0,0,32,32,parent,nullptr,wc.hInstance,nullptr);
    assert(window);return window;
}
int main(){
    HBRUSH white=CreateSolidBrush(RGB(255,255,255)),later=CreateSolidBrush(RGB(61,61,61));
    HBRUSH pattern=CreateHatchBrush(HS_DIAGCROSS,RGB(255,255,255));assert(white&&later&&pattern);
    HWND root=Window(L"CabinetWClass",white),otherRoot=Window(L"OtherApplication",white);
    HWND window=Window(L"Shell Preview Extension Host",white,root);
    HWND other=Window(L"Shell Preview Extension Host",white,otherRoot);
    HWND wrongClass=Window(L"UnknownPreview",white,root);
    fixtureDC=CreateCompatibleDC(nullptr);assert(fixtureDC);
    HDC memory=CreateCompatibleDC(nullptr),foreign=GetDC(other),actual=GetDC(window);assert(memory&&foreign&&actual);
    BITMAPINFO info{};info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);info.bmiHeader.biWidth=32;
    info.bmiHeader.biHeight=-32;info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;
    void* pixels=nullptr;HBITMAP bitmap=CreateDIBSection(fixtureDC,&info,DIB_RGB_COLORS,&pixels,nullptr,0);assert(bitmap);
    HGDIOBJ old=SelectObject(fixtureDC,bitmap);assert(old&&old!=HGDI_ERROR);
    background=RGB(0,0,0);backgroundBrush=CreateSolidBrush(background);assert(backgroundBrush);
    originalFillRect=FixtureFill;originalDefWindowProc=FixtureDefault;enabled=true;fixtureOwner=window;
    RECT rect{0,0,32,32};FillRect(fixtureDC,&rect,white);
    assert(PaintPreviewBacking(window,actual)); // Real owned window DC admission.
    assert(DefaultWindowHook(window,WM_ERASEBKGND,reinterpret_cast<WPARAM>(fixtureDC),0)==1);
    assert(!nativeCalls&&GetPixel(fixtureDC,16,16)==background);
    assert(GetClassLongPtrW(window,GCLP_HBRBACKGROUND)==reinterpret_cast<LONG_PTR>(white));
    assert(!PaintPreviewBacking(window,foreign)&&!PaintPreviewBacking(window,memory));
    fixtureOwner=other;assert(!PaintPreviewBacking(other,fixtureDC));
    fixtureOwner=wrongClass;assert(!PaintPreviewBacking(wrongClass,fixtureDC));fixtureOwner=window;
    foreignProcess=window;assert(!PaintPreviewBacking(window,fixtureDC));
    foreignProcess=root;assert(!PaintPreviewBacking(window,fixtureDC));foreignProcess=nullptr;
    assert(!PaintPreviewBacking(root,fixtureDC)&&!PaintPreviewBacking(nullptr,fixtureDC)&&!PaintPreviewBacking(window,nullptr));
    highContrast=true;assert(!PaintPreviewBacking(window,fixtureDC));highContrast=false;
    contrastFailure=true;assert(!PaintPreviewBacking(window,fixtureDC));contrastFailure=false;
    drawingTheme=true;assert(!PaintPreviewBacking(window,fixtureDC));drawingTheme=false;
    for(HBRUSH brush:{later,pattern,(HBRUSH)nullptr,(HBRUSH)(COLOR_WINDOW+1)}){
        SetClassLongPtrW(window,GCLP_HBRBACKGROUND,reinterpret_cast<LONG_PTR>(brush));
        assert(!PaintPreviewBacking(window,fixtureDC));
        assert(GetClassLongPtrW(window,GCLP_HBRBACKGROUND)==reinterpret_cast<LONG_PTR>(brush));
    }
    SetClassLongPtrW(window,GCLP_HBRBACKGROUND,reinterpret_cast<LONG_PTR>(white));
    int saved=SaveDC(fixtureDC);assert(saved);SetMapMode(fixtureDC,MM_LOMETRIC);
    assert(!PaintPreviewBacking(window,fixtureDC));RestoreDC(fixtureDC,saved);
    SetViewportOrgEx(fixtureDC,1,0,nullptr);assert(!PaintPreviewBacking(window,fixtureDC));SetViewportOrgEx(fixtureDC,0,0,nullptr);
    SetWindowOrgEx(fixtureDC,0,1,nullptr);assert(!PaintPreviewBacking(window,fixtureDC));SetWindowOrgEx(fixtureDC,0,0,nullptr);
    SetGraphicsMode(fixtureDC,GM_ADVANCED);assert(!PaintPreviewBacking(window,fixtureDC));SetGraphicsMode(fixtureDC,GM_COMPATIBLE);
    saved=SaveDC(fixtureDC);assert(saved);SetLayout(fixtureDC,LAYOUT_RTL);
    assert(!PaintPreviewBacking(window,fixtureDC));assert(RestoreDC(fixtureDC,saved));
    FillRect(fixtureDC,&rect,white);HRGN clip=CreateRectRgn(4,4,28,28),after=CreateRectRgn(0,0,0,0);assert(clip&&after);
    SelectClipRgn(fixtureDC,clip);SetTextColor(fixtureDC,RGB(2,3,4));SetBkColor(fixtureDC,RGB(5,6,7));
    HGDIOBJ selectedBrush=GetCurrentObject(fixtureDC,OBJ_BRUSH);
    assert(PaintPreviewBacking(window,fixtureDC));assert(GetClipRgn(fixtureDC,after)==1&&EqualRgn(clip,after));
    assert(GetTextColor(fixtureDC)==RGB(2,3,4)&&GetBkColor(fixtureDC)==RGB(5,6,7));
    assert(GetCurrentObject(fixtureDC,OBJ_BRUSH)==selectedBrush&&GetMapMode(fixtureDC)==MM_TEXT&&GetLayout(fixtureDC)==0);
    SelectClipRgn(fixtureDC,nullptr);assert(GetPixel(fixtureDC,16,16)==background&&GetPixel(fixtureDC,1,1)==RGB(255,255,255));
    fillFailure=true;assert(!PaintPreviewBacking(window,fixtureDC));
    assert(DefaultWindowHook(window,WM_ERASEBKGND,reinterpret_cast<WPARAM>(fixtureDC),0)==1);assert(nativeCalls==1);fillFailure=false;
    enabled=false;assert(!PaintPreviewBacking(window,fixtureDC));
    assert(DefaultWindowHook(window,WM_ERASEBKGND,reinterpret_cast<WPARAM>(fixtureDC),0)==1);
    assert(nativeCalls==2&&GetPixel(fixtureDC,16,16)==RGB(255,255,255));enabled=true;
    assert(DefaultWindowHook(window,WM_USER+1,0,0)==DefWindowProcW(window,WM_USER+1,0,0));assert(nativeCalls==3);
    DWORD objects=GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS);
    for(unsigned i=0;i<100;++i)assert(PaintPreviewBacking(window,fixtureDC));
    assert(GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS)==objects);
    SetWindowPos(window,nullptr,0,0,0,0,SWP_NOMOVE|SWP_NOZORDER|SWP_NOACTIVATE);
    assert(!PaintPreviewBacking(window,fixtureDC));
    DeleteObject(clip);DeleteObject(after);SelectObject(fixtureDC,old);DeleteObject(bitmap);DeleteDC(memory);DeleteDC(fixtureDC);
    ReleaseDC(window,actual);ReleaseDC(other,foreign);DestroyWindow(root);DestroyWindow(otherRoot);
    for(auto name:{L"CabinetWClass",L"OtherApplication",L"Shell Preview Extension Host",L"UnknownPreview"})assert(UnregisterClassW(name,GetModuleHandleW(nullptr)));
    DeleteObject(backgroundBrush);backgroundBrush=nullptr;DeleteObject(pattern);DeleteObject(later);DeleteObject(white);
    puts("Explorer preview erasure, ownership, clipping, native fallback and stable GDI lifetime passed");
}
