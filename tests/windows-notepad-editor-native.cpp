// Offscreen rendering/control fixture. No document is loaded or reformatted.
#include <windows.h>
#include <d2d1.h>
#include <dwrite_2.h>
#include <cassert>
#include <cmath>
static bool fixtureHighContrast=false;
static BOOL WINAPI FixtureSystemParametersInfo(UINT action,UINT size,PVOID value,UINT flags){
 if(action==SPI_GETHIGHCONTRAST){static_cast<HIGHCONTRASTW*>(value)->dwFlags=fixtureHighContrast?HCF_HIGHCONTRASTON:0;return TRUE;}
 return SystemParametersInfoW(action,size,value,flags);
}
#define SystemParametersInfoW FixtureSystemParametersInfo
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static BOOL Wh_ApplyHookOperations(){return TRUE;}
static int Wh_GetIntSetting(PCWSTR){return 0;}
#include "../ports/windows/dist/j3w1-notepad-native.wh.cpp"
static COLORREF editorBackground=RGB(31,32,33);
static LRESULT CALLBACK EditorProc(HWND,UINT message,WPARAM,LPARAM value){
 if(message==EM_SETBKGNDCOLOR){auto before=editorBackground;editorBackground=static_cast<COLORREF>(value);return before;}
 return 0;
}
static ID2D1RenderTarget* expectedTarget=nullptr;
static const DWRITE_GLYPH_RUN* expectedRun=nullptr;
static ID2D1Brush* expectedIdentity=nullptr;
static D2D1_COLOR_F painted{};
static unsigned calls=0;
static void STDMETHODCALLTYPE CaptureGlyph(ID2D1RenderTarget* target,D2D1_POINT_2F point,const DWRITE_GLYPH_RUN* run,ID2D1Brush* brush,DWRITE_MEASURING_MODE mode){
 assert(target==expectedTarget&&run==expectedRun&&point.x==11&&point.y==17&&mode==DWRITE_MEASURING_MODE_GDI_NATURAL);
 if(expectedIdentity)assert(brush==expectedIdentity);
 ID2D1SolidColorBrush* solid=nullptr;assert(SUCCEEDED(brush->QueryInterface(IID_PPV_ARGS(&solid))));painted=solid->GetColor();solid->Release();
 assert(brush->GetOpacity()==0.75f);D2D1_MATRIX_3X2_F transform;brush->GetTransform(&transform);assert(transform._31==3&&transform._32==7);calls++;
}
static void Paint(ID2D1Brush* brush,ID2D1Brush* identity=nullptr){
 expectedIdentity=identity;auto before=calls;
 Glyph(expectedTarget,D2D1::Point2F(11,17),expectedRun,brush,DWRITE_MEASURING_MODE_GDI_NATURAL);assert(calls==before+1);
}
int main(){
 // Save/restore background, later app-owned requests and runtime accessibility.
 WNDCLASSW c{};c.lpfnWndProc=DefWindowProcW;c.hInstance=GetModuleHandleW(nullptr);c.lpszClassName=L"RichEditD2DPT";assert(RegisterClassW(&c));
 auto window=CreateWindowExW(0,c.lpszClassName,L"",WS_OVERLAPPED,0,0,32,32,nullptr,nullptr,c.hInstance,nullptr);assert(window);
 originalProc=EditorProc;originalColor=GetSysColor;enabled=true;
 const auto baseline=editorBackground;RefreshEdit(window);assert(editorBackground==canvas&&edits.size()==1);
 auto next=RGB(41,42,43);Proc(window,EM_SETBKGNDCOLOR,0,next);assert(editorBackground==canvas);
 fixtureHighContrast=true;RefreshEdit(window);assert(editorBackground==next&&edits.empty());
 fixtureHighContrast=false;RefreshEdit(window);assert(editorBackground==canvas);enabled=false;RefreshEdit(window);assert(editorBackground==next&&edits.empty());
 editorBackground=baseline;DestroyWindow(window);
 // Glyph brush substitution leaves positioning, mode, transform and opacity.
 ID2D1Factory* factory=nullptr;assert(SUCCEEDED(D2D1CreateFactory(D2D1_FACTORY_TYPE_MULTI_THREADED,&factory)));
 ID2D1DCRenderTarget* target=nullptr;auto properties=D2D1::RenderTargetProperties(D2D1_RENDER_TARGET_TYPE_DEFAULT,D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM,D2D1_ALPHA_MODE_IGNORE));
 assert(SUCCEEDED(factory->CreateDCRenderTarget(&properties,&target)));expectedTarget=target;
 ID2D1SolidColorBrush* brush=nullptr;assert(SUCCEEDED(target->CreateSolidColorBrush(D2D1::ColorF(1,1,1,1),&brush)));
 brush->SetOpacity(0.75f);brush->SetTransform(D2D1::Matrix3x2F::Translation(3,7));
 UINT16 glyph=1;FLOAT advance=12;DWRITE_GLYPH_OFFSET offset{};DWRITE_GLYPH_RUN run{nullptr,14,1,&glyph,&advance,&offset,FALSE,0};expectedRun=&run;originalGlyph=CaptureGlyph;
 enabled=true;editCall=false;Paint(brush,brush);assert(painted.r==1&&painted.g==1&&painted.b==1);
 editCall=true;Paint(brush);assert(std::abs(painted.r-GetRValue(prose)/255.0f)<0.00001f&&std::abs(painted.g-GetGValue(prose)/255.0f)<0.00001f);
 fixtureHighContrast=true;Paint(brush,brush);assert(painted.r==1);fixtureHighContrast=false;
 brush->SetColor(D2D1::ColorF(0,0,1,1));Paint(brush,brush);assert(painted.b==1&&painted.r==0);
 brush->SetColor(D2D1::ColorF(1,1,1,0.5f));Paint(brush,brush);assert(painted.a==0.5f);
 brush->SetColor(D2D1::ColorF(1,1,1,1));
 // Preserve the actual system color-emoji font rather than making it rose.
 IDWriteFactory* write=nullptr;assert(SUCCEEDED(DWriteCreateFactory(DWRITE_FACTORY_TYPE_SHARED,__uuidof(IDWriteFactory),reinterpret_cast<IUnknown**>(&write))));
 IDWriteFontCollection* fonts=nullptr;assert(SUCCEEDED(write->GetSystemFontCollection(&fonts)));
 UINT32 index=0;BOOL exists=FALSE;assert(SUCCEEDED(fonts->FindFamilyName(L"Segoe UI Emoji",&index,&exists))&&exists);
 IDWriteFontFamily* family=nullptr;IDWriteFont* font=nullptr;IDWriteFontFace* face=nullptr;IDWriteFontFace2* colorFace=nullptr;
 assert(SUCCEEDED(fonts->GetFontFamily(index,&family)));assert(SUCCEEDED(family->GetFirstMatchingFont(DWRITE_FONT_WEIGHT_NORMAL,DWRITE_FONT_STRETCH_NORMAL,DWRITE_FONT_STYLE_NORMAL,&font)));
 assert(SUCCEEDED(font->CreateFontFace(&face)));assert(SUCCEEDED(face->QueryInterface(IID_PPV_ARGS(&colorFace)))&&colorFace->IsColorFont());
 run.fontFace=face;Paint(brush,brush);assert(painted.r==1&&painted.g==1&&painted.b==1);
 colorFace->Release();face->Release();font->Release();family->Release();fonts->Release();write->Release();brush->Release();target->Release();factory->Release();return 0;
}
