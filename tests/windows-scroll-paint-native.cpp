// Native Windows regression: hidden synthetic windows and offscreen DC ownership.
#include <windows.h>
#include <cassert>
#include <cstdio>
#include <cstring>
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static PCWSTR Wh_GetStringSetting(PCWSTR){return L"#000000";}
static void Wh_FreeStringSetting(PCWSTR){}
static bool forceHighContrast=false,failHighContrast=false;
static BOOL WINAPI ContrastFixture(UINT action,UINT parameter,PVOID value,UINT flags){
    if(action==SPI_GETHIGHCONTRAST){
        if(failHighContrast)return FALSE;
        if(forceHighContrast){static_cast<HIGHCONTRASTW*>(value)->dwFlags=HCF_HIGHCONTRASTON;return TRUE;}
    }
    return SystemParametersInfoW(action,parameter,value,flags);
}
#define SystemParametersInfoW ContrastFixture
#include "windows-windhawk-symbol-stubs.h"
#include "../ports/windows/dist/j3w1-explorer-native.wh.cpp"
#undef SystemParametersInfoW
static HWND Window(const wchar_t* name){
    WNDCLASSW c{};c.lpfnWndProc=DefWindowProcW;c.hInstance=GetModuleHandleW(nullptr);c.lpszClassName=name;
    assert(RegisterClassW(&c));HWND w=CreateWindowExW(0,name,L"",0,0,0,32,32,nullptr,nullptr,c.hInstance,nullptr);assert(w);return w;
}
static HDC dispatchedDC;
static HWND folderWindow,otherWindow;
static const MSG* expectedMessage;
static bool expectedAdmission;
static unsigned dispatchCalls;
static LRESULT WINAPI DispatchFixture(const MSG* message){
    assert(message==expectedMessage);++dispatchCalls;
    assert(ExplorerDC(dispatchedDC,true)==expectedAdmission);
    assert(!ExplorerDC(dispatchedDC)); // Dispatch never admits general theme/GDI recoloring.
    if(!defaultWindow)assert(!TooltipDC(dispatchedDC));
    if(expectedAdmission){
        {DefaultPaintScope nested(otherWindow);assert(!ExplorerDC(dispatchedDC,true));}
        assert(ExplorerDC(dispatchedDC,true));
        {DefaultPaintScope nested(nullptr);assert(!ExplorerDC(dispatchedDC,true));}
        assert(ExplorerDC(dispatchedDC,true));
        enabled=false;assert(!ExplorerDC(dispatchedDC,true));enabled=true;
        drawingTheme=true;assert(!ExplorerDC(dispatchedDC,true));drawingTheme=false;
        forceHighContrast=true;assert(!ExplorerDC(dispatchedDC,true));forceHighContrast=false;
        failHighContrast=true;assert(!ExplorerDC(dispatchedDC,true));failHighContrast=false;
        HDC explicitOther=GetDC(otherWindow);assert(explicitOther);
        assert(!ExplorerDC(explicitOther,true));ReleaseDC(otherWindow,explicitOther);
    }
    return 0x123456;
}
static void Dispatch(HWND window,bool admitted){
    MSG message{};message.hwnd=window;message.message=WM_LBUTTONDOWN;
    message.wParam=MK_LBUTTON;message.lParam=MAKELPARAM(11,17);message.time=1234;
    MSG before=message;expectedMessage=&message;expectedAdmission=admitted;
    assert(DispatchWindowHook(&message)==0x123456);
    assert(std::memcmp(&message,&before,sizeof(message))==0);
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
    paintWindows.clear();
    dispatchedDC=memory;folderWindow=folder;otherWindow=unrelated;originalDispatchMessage=DispatchFixture;
    Dispatch(folder,true);assert(!ExplorerDC(memory,true));
    {DefaultPaintScope outer(folder);Dispatch(unrelated,false);assert(ExplorerDC(memory,true));
        Dispatch(nullptr,false);assert(ExplorerDC(memory,true));
        expectedMessage=nullptr;expectedAdmission=false;assert(DispatchWindowHook(nullptr)==0x123456);
        assert(ExplorerDC(memory,true));
    }
    {DefaultPaintScope outer(unrelated);Dispatch(folder,true);assert(!ExplorerDC(memory,true));}
    Dispatch(unrelated,false);Dispatch(nullptr,false);
    assert(dispatchCalls==7);assert(!scrollbarWindowScoped&&!scrollbarWindow&&!defaultWindow);
    assert(!ExplorerDC(memory,true));
    DeleteDC(memory);DestroyWindow(folder);DestroyWindow(unrelated);
    puts("PASS: actual scrollbar dispatch/default ownership; nested unrelated and ownerless masking; high-contrast/query-failure, explicit DC, disabled and recursion passthrough; unchanged input/result; no stale scope");
}
