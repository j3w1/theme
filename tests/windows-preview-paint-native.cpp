// Native Windows regression: offscreen GDI pixels, no desktop input or capture.
// Compile with the same x64 MinGW compiler used by the pinned Windhawk runtime.
#include <windows.h>
#include <cassert>
#include <cstdio>
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static int Wh_GetIntSetting(const wchar_t*){return 1;}
#include "../ports/windows/dist/j3w1-powertoys-preview.wh.cpp"
static HWND Window(const wchar_t* name){
    WNDCLASSW c{};c.lpfnWndProc=DefWindowProcW;c.hInstance=GetModuleHandleW(nullptr);c.lpszClassName=name;
    assert(RegisterClassW(&c));
    HWND w=CreateWindowExW(0,name,L"",0,0,0,32,32,nullptr,nullptr,c.hInstance,nullptr);assert(w);return w;
}
int main(){
    assert(!HighContrast());
    templatePath=L"not-a-preview-template";assert(!ReviewedInstalledTemplate());
    assert(!Wh_ModInit()); // This synthetic executable is not the pinned host.
    originalFillRect=FillRect;originalSetTextColor=SetTextColor;originalSetBkColor=SetBkColor;
    HWND label=Window(L"WindowsForms10.Static.app.0.2360855_r3_ad1"),panel=Window(L"WindowsForms10.Window.test"),other=Window(L"WindowsForms10.EDIT.test");
    assert(LoadingWindow(label)&&LoadingWindow(panel)&&!LoadingWindow(other));
    assert(!LoadingWindow(Window(L"WindowsForms10.STATICinvalid")));
    HDC dc=CreateCompatibleDC(nullptr);assert(dc);
    BITMAPINFO info{};info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);info.bmiHeader.biWidth=32;info.bmiHeader.biHeight=-32;info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;
    void* pixels=nullptr;HBITMAP bitmap=CreateDIBSection(dc,&info,DIB_RGB_COLORS,&pixels,nullptr,0);assert(bitmap);
    HGDIOBJ old=SelectObject(dc,bitmap);RECT r{0,0,32,32};HBRUSH gray=CreateSolidBrush(RGB(30,30,30)),data=CreateSolidBrush(RGB(12,40,90));
    enabled=true;
    LoadingFillHook(dc,&r,gray);assert(GetPixel(dc,4,4)==RGB(30,30,30));
    paintWindows.push_back(label);
    LoadingFillHook(dc,&r,gray);assert(GetPixel(dc,4,4)==loadingBackground);
    LOGBRUSH original{};assert(GetObjectW(gray,sizeof(original),&original)==sizeof(original));assert(original.lbColor==RGB(30,30,30));
    SetTextColor(dc,RGB(1,2,3));assert(LoadingTextHook(dc,RGB(255,255,255))==RGB(1,2,3));assert(GetTextColor(dc)==loadingForeground);
    LoadingBkHook(dc,RGB(30,30,30));assert(GetBkColor(dc)==loadingBackground);
    LoadingFillHook(dc,&r,data);assert(GetPixel(dc,4,4)==RGB(12,40,90));
    paintWindows.push_back(other);LoadingFillHook(dc,&r,gray);assert(GetPixel(dc,4,4)==RGB(30,30,30));paintWindows.pop_back();
    enabled=false;LoadingFillHook(dc,&r,gray);assert(GetPixel(dc,4,4)==RGB(30,30,30));
    paintWindows.clear();
    HWND progress=Window(L"WindowsForms10.msctls_progress32.app.0.2360855_r3_ad1");
    enabled=true;paintWindows.push_back(progress);
    themeClass=[](HTHEME,LPWSTR name,int size)->HRESULT{wcscpy_s(name,size,L"Progress");return S_OK;};
    originalProgressBackground=[](HTHEME,HDC target,int part,int,const RECT* rect,const RECT*)->HRESULT{
        RECT inner{rect->left+2,rect->top+2,rect->right-2,rect->bottom-2};
        HBRUSH brush=CreateSolidBrush(part==PP_FILL?RGB(0,160,0):RGB(40,40,40));
        FillRect(target,&inner,brush);DeleteObject(brush);return S_OK;
    };
    originalFillRect(dc,&r,gray);RECT clip{0,0,16,32};
    assert(SUCCEEDED(ProgressBackgroundHook(nullptr,dc,PP_FILL,PBFS_NORMAL,&r,&clip)));
    assert(GetPixel(dc,4,4)==progressFill);assert(GetPixel(dc,20,4)==RGB(30,30,30));
    assert(GetPixel(dc,0,0)==RGB(30,30,30)); // Native mask remains intact.
    assert(SUCCEEDED(ProgressBackgroundHook(nullptr,dc,PP_TRANSPARENTBAR,0,&r,nullptr)));
    assert(GetPixel(dc,4,4)==progressTrack);
    assert(SUCCEEDED(ProgressBackgroundHook(nullptr,dc,PP_FILL,PBFS_ERROR,&r,nullptr)));
    assert(GetPixel(dc,4,4)==RGB(0,160,0)); // Unobserved states remain native.
    enabled=false;ProgressBackgroundHook(nullptr,dc,PP_FILL,PBFS_NORMAL,&r,nullptr);assert(GetPixel(dc,4,4)==RGB(0,160,0));
    enabled=true;paintWindows.push_back(other);ProgressBackgroundHook(nullptr,dc,PP_FILL,PBFS_NORMAL,&r,nullptr);assert(GetPixel(dc,4,4)==RGB(0,160,0));
    paintWindows.clear();DestroyWindow(progress);DeleteObject(gray);DeleteObject(data);SelectObject(dc,old);DeleteObject(bitmap);DeleteDC(dc);
    DestroyWindow(label);DestroyWindow(panel);DestroyWindow(other);
    puts("PASS: scoped loading canvas/text pixels; unrelated and disabled passthrough; shared brush unchanged; nested paint isolation; progress palette, native mask, clipping and state passthrough");
}
