// Hidden synthetic owners and offscreen GDI only; no desktop input or capture.
#include <windows.h>
#include <cassert>
#include <cstdio>
static bool fixtureHighContrast=false;
static BOOL WINAPI FixtureSystemParametersInfo(UINT action,UINT size,PVOID value,UINT flags){
    if(action==SPI_GETHIGHCONTRAST){static_cast<HIGHCONTRASTW*>(value)->dwFlags=fixtureHighContrast?HCF_HIGHCONTRASTON:0;return TRUE;}
    return SystemParametersInfoW(action,size,value,flags);
}
#define SystemParametersInfoW FixtureSystemParametersInfo
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static PCWSTR setting=L"#1f911410";
static PCWSTR Wh_GetStringSetting(PCWSTR key){return !wcscmp(key,L"marquee")?setting:L"#e53935";}
static void Wh_FreeStringSetting(PCWSTR){}
#include "windows-windhawk-symbol-stubs.h"
#include "../ports/windows/dist/j3w1-explorer-native.wh.cpp"
struct Element {void* table;Element* root;HWND window;};
static HWND Window(PCWSTR name){
    WNDCLASSW c{};c.lpfnWndProc=DefWindowProcW;c.hInstance=GetModuleHandleW(nullptr);c.lpszClassName=name;
    assert(RegisterClassW(&c));HWND window=CreateWindowExW(0,name,L"",0,0,0,32,32,nullptr,nullptr,c.hInstance,nullptr);assert(window);return window;
}
static BLENDFUNCTION observedBlend;
static int blendCalls=0;
static HDC expectedDest,expectedSource;
static BOOL WINAPI Blend(HDC dest,int x,int y,int width,int height,HDC source,int sx,int sy,int sw,int sh,BLENDFUNCTION blend){
    assert(dest==expectedDest && source==expectedSource);
    assert(x==3 && y==4 && width==8 && height==9 && sx==1 && sy==2 && sw==6 && sh==7);
    observedBlend=blend;blendCalls++;return 37;
}
static HDC Surface(HBITMAP* bitmap,HGDIOBJ* old){
    HDC dc=CreateCompatibleDC(nullptr);assert(dc);BITMAPINFO info{};
    info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);info.bmiHeader.biWidth=32;info.bmiHeader.biHeight=-32;
    info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;void* pixels;
    *bitmap=CreateDIBSection(dc,&info,DIB_RGB_COLORS,&pixels,nullptr,0);assert(*bitmap);*old=SelectObject(dc,*bitmap);return dc;
}
static void Paint(HDC dc,const RECT& rect,COLORREF color){HBRUSH brush=CreateSolidBrush(color);assert(brush);assert(FillRect(dc,&rect,brush));DeleteObject(brush);}
int main(){
    assert(ReadMarquee() && marquee==RGB(145,20,16) && marqueeAlpha==31 && marqueeBorder==RGB(229,57,53));
    for(PCWSTR invalid:{L"#911410",L"#1f9114100",L"#zz911410",L"rgb(145 20 16 / 12%)"}){setting=invalid;assert(!ReadMarquee());}
    setting=L"#1f911410";assert(ReadMarquee());
    HWND cabinet=Window(L"CabinetWClass"),other=Window(L"OtherApplication");
    int targetTable,rootTable,unknownTable;marqueeVtable=&targetTable;itemsViewVtable=&rootTable;
    Element root{itemsViewVtable,nullptr,cabinet},target{marqueeVtable,&root,nullptr},unknown{&unknownTable,&root,nullptr};
    elementRoot=[](void* element)->void*{return static_cast<Element*>(element)->root;};
    elementWindow=[](void* element)->HWND{return static_cast<Element*>(element)->window;};
    originalSysColor=GetSysColor;originalAlphaBlend=Blend;enabled=true;
    assert(MarqueeElement(&target) && !MarqueeElement(&unknown) && !MarqueeElement(nullptr));
    root.window=other;assert(!MarqueeElement(&target));root.window=cabinet;
    root.table=&unknownTable;assert(!MarqueeElement(&target));root.table=itemsViewVtable;
    target.root=nullptr;assert(!MarqueeElement(&target));target.root=&root;
    assert(!FixedModuleVersion(nullptr,0,0));assert(!InitMarquee());
    assert(FindExactSymbol(GetModuleHandleW(nullptr),L"missing")==nullptr);
    BLENDFUNCTION native{AC_SRC_OVER,0,85,0};expectedDest=(HDC)1;expectedSource=(HDC)2;
    auto blend=[&](BLENDFUNCTION value){assert(AlphaBlendHook(expectedDest,3,4,8,9,expectedSource,1,2,6,7,value)==37);};
    {MarqueePaintScope scope(&target,MarqueePaint::Background);
        assert(SysColorHook(COLOR_HOTLIGHT)==marquee && SysColorHook(COLOR_HIGHLIGHT)==GetSysColor(COLOR_HIGHLIGHT));
        assert(SysColorHook(COLOR_WINDOW)==GetSysColor(COLOR_WINDOW));
        blend(native);assert(observedBlend.SourceConstantAlpha==31 && native.SourceConstantAlpha==85);
        for(BLENDFUNCTION unsupported: {BLENDFUNCTION{AC_SRC_OVER,0,84,0},BLENDFUNCTION{AC_SRC_OVER,0,85,AC_SRC_ALPHA},BLENDFUNCTION{AC_SRC_OVER,1,85,0},BLENDFUNCTION{1,0,85,0}}){
            blend(unsupported);assert(memcmp(&observedBlend,&unsupported,sizeof(unsupported))==0);
        }
        {MarqueePaintScope nested(&unknown,MarqueePaint::Background);assert(SysColorHook(COLOR_HOTLIGHT)==GetSysColor(COLOR_HOTLIGHT));blend(native);assert(observedBlend.SourceConstantAlpha==85);}
        assert(SysColorHook(COLOR_HOTLIGHT)==marquee);
        {MarqueePaintScope nested(&target,MarqueePaint::Border);assert(SysColorHook(COLOR_HIGHLIGHT)==marqueeBorder);blend(native);assert(observedBlend.SourceConstantAlpha==85);}
        assert(marqueePaint==MarqueePaint::Background);
        fixtureHighContrast=true;assert(SysColorHook(COLOR_HOTLIGHT)==GetSysColor(COLOR_HOTLIGHT));blend(native);assert(observedBlend.SourceConstantAlpha==85);fixtureHighContrast=false;
        enabled=false;assert(SysColorHook(COLOR_HOTLIGHT)==GetSysColor(COLOR_HOTLIGHT));blend(native);assert(observedBlend.SourceConstantAlpha==85);enabled=true;
        drawingTheme=true;assert(SysColorHook(COLOR_HOTLIGHT)==GetSysColor(COLOR_HOTLIGHT));blend(native);assert(observedBlend.SourceConstantAlpha==85);drawingTheme=false;
    }
    assert(marqueePaint==MarqueePaint::None);blend(native);assert(observedBlend.SourceConstantAlpha==85 && blendCalls==11);
    HBITMAP bitmap;HGDIOBJ old;HDC dc=Surface(&bitmap,&old);RECT rect{0,0,32,32};void* marker=&unknown;
    static void* expectedElement;expectedElement=&target;
    originalElementBackground=[](void* element,HDC dc,void* value,const RECT& a,const RECT& b,const RECT& c,const RECT& d){
        assert(element==expectedElement && value && &a==&b && &b==&c && &c==&d);Paint(dc,a,SysColorHook(COLOR_HOTLIGHT));};
    ElementBackgroundHook(&target,dc,marker,rect,rect,rect,rect);assert(GetPixel(dc,4,4)==marquee);
    expectedElement=&unknown;ElementBackgroundHook(&unknown,dc,marker,rect,rect,rect,rect);assert(GetPixel(dc,4,4)==GetSysColor(COLOR_HOTLIGHT));
    expectedElement=&target;
    originalElementBorder=[](void* element,HDC dc,void* value,RECT* r,const RECT& clip){assert(element==expectedElement && value && r==&clip);Paint(dc,*r,SysColorHook(COLOR_HIGHLIGHT));};
    ElementBorderHook(&target,dc,marker,&rect,rect);assert(GetPixel(dc,4,4)==marqueeBorder);
    fixtureHighContrast=true;assert(!MarqueeElement(&target));ElementBackgroundHook(&target,dc,marker,rect,rect,rect,rect);assert(GetPixel(dc,4,4)==GetSysColor(COLOR_HOTLIGHT));fixtureHighContrast=false;
    enabled=false;assert(!MarqueeElement(&target));ElementBorderHook(&target,dc,marker,&rect,rect);assert(GetPixel(dc,4,4)==GetSysColor(COLOR_HIGHLIGHT));enabled=true;
    // Compare actual compositing with a separate canonical-alpha GDI baseline.
    HBITMAP sourceBitmap,baselineBitmap;HGDIOBJ sourceOld,baselineOld;
    HDC source=Surface(&sourceBitmap,&sourceOld),baseline=Surface(&baselineBitmap,&baselineOld);
    Paint(source,rect,marquee);Paint(dc,rect,RGB(0,0,0));Paint(baseline,rect,RGB(0,0,0));originalAlphaBlend=GdiAlphaBlend;
    {MarqueePaintScope scope(&target,MarqueePaint::Background);assert(AlphaBlendHook(dc,0,0,32,32,source,0,0,32,32,native));}
    BLENDFUNCTION canonical{AC_SRC_OVER,0,31,0};assert(GdiAlphaBlend(baseline,0,0,32,32,source,0,0,32,32,canonical));
    assert(GetPixel(dc,4,4)==GetPixel(baseline,4,4) && GetPixel(dc,4,4)!=marquee);
    assert(marqueePaint==MarqueePaint::None);
    SelectObject(source,sourceOld);DeleteObject(sourceBitmap);DeleteDC(source);
    SelectObject(baseline,baselineOld);DeleteObject(baselineBitmap);DeleteDC(baseline);
    SelectObject(dc,old);DeleteObject(bitmap);DeleteDC(dc);DestroyWindow(cabinet);DestroyWindow(other);
    puts("PASS: scoped marquee identity, actual owner, canonical ARGB/alpha and offscreen pixels; nested restoration, unrelated colors and controls, unsupported blends, missing symbols, high contrast, disabled/unload and API argument/return preservation");
}
