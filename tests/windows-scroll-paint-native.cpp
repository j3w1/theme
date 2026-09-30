// Native Windows regression: hidden synthetic windows and offscreen DC ownership.
#include <windows.h>
#include <cassert>
#include <cstdio>
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static PCWSTR Wh_GetStringSetting(PCWSTR){return L"#000000";}
static void Wh_FreeStringSetting(PCWSTR){}
#include "windows-windhawk-symbol-stubs.h"
#include "../ports/windows/dist/j3w1-explorer-native.wh.cpp"
static HWND Window(const wchar_t* name){
    WNDCLASSW c{};c.lpfnWndProc=DefWindowProcW;c.hInstance=GetModuleHandleW(nullptr);c.lpszClassName=name;
    assert(RegisterClassW(&c));HWND w=CreateWindowExW(0,name,L"",0,0,0,32,32,nullptr,nullptr,c.hInstance,nullptr);assert(w);return w;
}
int main(){
    assert(!HighContrast());HWND folder=Window(L"CabinetWClass"),unrelated=Window(L"OtherApplication");
    HDC memory=CreateCompatibleDC(nullptr);assert(memory);enabled=true;
    assert(!ExplorerDC(memory,true));
    {DefaultPaintScope outer(folder);assert(ExplorerDC(memory,true));assert(!ExplorerDC(memory));
        {DefaultPaintScope inner(unrelated);assert(!ExplorerDC(memory,true));}
        assert(ExplorerDC(memory,true));
        enabled=false;assert(!ExplorerDC(memory,true));enabled=true;
        drawingTheme=true;assert(!ExplorerDC(memory,true));drawingTheme=false;
        HDC other=GetDC(unrelated);assert(other);assert(!ExplorerDC(other,true));ReleaseDC(unrelated,other);
    }
    assert(!ExplorerDC(memory,true));paintWindows.push_back(folder);assert(ExplorerDC(memory));
    {DefaultPaintScope unrelatedDefault(unrelated);assert(!ExplorerDC(memory,true));}
    paintWindows.clear();DeleteDC(memory);DestroyWindow(folder);DestroyWindow(unrelated);
    puts("PASS: scrollbar default-procedure ownership; nested restoration; unrelated owner, disabled and recursion passthrough; no stale scope");
}
