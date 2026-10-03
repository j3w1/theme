// Hidden native controls and stock/synthetic glyphs only; no desktop input.
#include <windows.h>
#include <shellapi.h>
#include <shlobj.h>
#include <commoncontrols.h>
#include <bcrypt.h>
#include <cassert>
#include <cstdio>
#include <new>
static HWND fixtureOwner;
static bool fixtureContrast=false;
static unsigned stockQueries=0,extendedCalls=0;
static bool expectNativeRaster=false;static unsigned nativeRasters=0;
static BOOL WINAPI FixtureIcon(HDC,int,int,HICON,int,int,UINT,HBRUSH,UINT);
static constexpr unsigned long long extension=0x57444F5241570001ull;
static BOOL WINAPI FixtureGui(DWORD,GUITHREADINFO* value){value->hwndActive=fixtureOwner;return TRUE;}
static BOOL WINAPI FixtureParameters(UINT action,UINT size,PVOID value,UINT flags){if(action==SPI_GETHIGHCONTRAST){static_cast<HIGHCONTRASTW*>(value)->dwFlags=fixtureContrast?HCF_HIGHCONTRASTON:0;return TRUE;}return SystemParametersInfoW(action,size,value,flags);}
static HRESULT WINAPI FixtureStock(SHSTOCKICONID id,UINT flags,SHSTOCKICONINFO* value){++stockQueries;return SHGetStockIconInfo(id,flags,value);}
static void Extended(IMAGELISTDRAWPARAMS* value){if(value->cbSize==96){unsigned long long tail=0;memcpy(&tail,reinterpret_cast<BYTE*>(value)+88,8);assert(tail==extension);++extendedCalls;}}
static BOOL WINAPI FixtureDraw(IMAGELISTDRAWPARAMS* request){Extended(request);auto standard=*request;standard.cbSize=sizeof(standard);return ImageList_DrawIndirect(&standard);}
#define DrawIconEx FixtureIcon
#define GetGUIThreadInfo FixtureGui
#define SystemParametersInfoW FixtureParameters
#define SHGetStockIconInfo FixtureStock
#define ImageList_DrawIndirect FixtureDraw
// The CI host is not the reviewed desktop. Substitute only the metadata
// returned by native APIs inside this synthetic executable; production DLLs
// retain their exact version and complete file-hash admission.
static bool fixtureWicPins=false,fixtureWicVersion=false,fixtureWicHash=false,fixtureHookFailure=false;
static unsigned fixtureVersionCalls=0,fixtureHashCalls=0,fixtureHookCalls=0;
static constexpr char fixtureWicDigest[]="ad3f960fc9d612c0289035f1b5c334dd44e423ce6c23059ab5129746cd0646f2";
static BOOL WINAPI FixtureQueryVersion(LPCVOID block,LPCWSTR key,LPVOID* output,PUINT size) {
 BOOL result=::VerQueryValueW(block,key,output,size);
 if(fixtureWicPins&&result&&key&&wcscmp(key,L"\\")==0&&output&&*output&&size&&*size>=sizeof(VS_FIXEDFILEINFO)) {
  ++fixtureVersionCalls;auto version=static_cast<VS_FIXEDFILEINFO*>(*output);
  version->dwFileVersionMS=fixtureWicVersion?MAKELONG(0,10):0;
  version->dwFileVersionLS=fixtureWicVersion?MAKELONG(9549,26100):0;
 }
 return result;
}
static NTSTATUS WINAPI FixtureFinishHash(BCRYPT_HASH_HANDLE hash,PUCHAR output,ULONG size,ULONG flags) {
 NTSTATUS result=::BCryptFinishHash(hash,output,size,flags);
 if(fixtureWicPins&&result>=0&&output&&size==32) {
  ++fixtureHashCalls;
  auto nibble=[](char c)->BYTE{return c>='a'?c-'a'+10:c-'0';};
  for(unsigned n=0;n<32;n++)output[n]=static_cast<BYTE>((nibble(fixtureWicDigest[n*2])<<4)|nibble(fixtureWicDigest[n*2+1]));
  if(!fixtureWicHash)output[0]^=1;
 }
 return result;
}
static BOOL Wh_SetFunctionHook(void*,void*,void**) {++fixtureHookCalls;return !fixtureHookFailure;}
#define VerQueryValueW FixtureQueryVersion
#define BCryptFinishHash FixtureFinishHash
static PCWSTR Wh_GetStringSetting(PCWSTR){return L"#000000";}
static void Wh_FreeStringSetting(PCWSTR){}
#include "windows-windhawk-symbol-stubs.h"
#include "../ports/windows/dist/j3w1-explorer-native.wh.cpp"
#undef DrawIconEx
static BOOL WINAPI FixtureIcon(HDC dc,int x,int y,HICON icon,int width,int height,UINT step,HBRUSH brush,UINT flags) {
 if(expectNativeRaster){assert(FolderGlyph::painting);++nativeRasters;}
 return DrawIconEx(dc,x,y,icon,width,height,step,brush,flags);
}
static HWND Window(PCWSTR name){WNDCLASSW type{};type.lpfnWndProc=DefWindowProcW;type.hInstance=GetModuleHandleW(nullptr);type.lpszClassName=name;assert(RegisterClassW(&type)||GetLastError()==ERROR_CLASS_ALREADY_EXISTS);auto window=CreateWindowExW(0,name,L"",0,0,0,32,32,nullptr,nullptr,type.hInstance,nullptr);assert(window);return window;}
int main(int argc,char** argv){
 // Real module admission remains fail closed on a different CI Windows build.
 // Test native hashing/version inspection independently of COM initialization,
 // then exercise all admission combinations with controlled API results.
 auto wicModule=LoadLibraryW(L"windowscodecs.dll");assert(wicModule);
 bool actualReviewed=FixedModuleVersion(wicModule,MAKELONG(0,10),MAKELONG(9549,26100))
  &&FolderBitmap::Digest(wicModule,fixtureWicDigest);
 assert(!FolderBitmap::Digest(wicModule,"0000000000000000000000000000000000000000000000000000000000000000"));
 assert(FolderBitmap::Init()==actualReviewed);FolderBitmap::Uninit();
 printf("Native WIC identity: %s; unsupported identities remain refused.\n",actualReviewed?"reviewed":"unreviewed");
 fixtureWicPins=true;
 for(bool version:{false,true})for(bool hash:{false,true}) {
  fixtureWicVersion=version;fixtureWicHash=hash;fixtureVersionCalls=fixtureHashCalls=fixtureHookCalls=0;
  assert(FolderBitmap::Init()==(version&&hash));
  assert(fixtureVersionCalls==1&&fixtureHashCalls==(version?1u:0u)&&fixtureHookCalls==(version&&hash?1u:0u));
  assert((FolderBitmap::retainedFactory!=nullptr)==(version&&hash));FolderBitmap::Uninit();
 }
 fixtureWicVersion=fixtureWicHash=true;fixtureHookFailure=true;
 assert(!FolderBitmap::Init()&&!FolderBitmap::retainedFactory);fixtureHookFailure=false;
 // Exercise both preexisting COM apartments. Initialization must not unbalance
 // an MTA when CoInitializeEx reports RPC_E_CHANGED_MODE.
 assert(SUCCEEDED(CoInitializeEx(nullptr,COINIT_MULTITHREADED)));
 assert(FolderBitmap::Init());FolderBitmap::Uninit();CoUninitialize();
 assert(SUCCEEDED(CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED)));
 // Warm the STA's native COM/WIC caches before measuring adapter cleanup.
 assert(FolderBitmap::Init());FolderBitmap::Uninit();
 DWORD handlesBefore=0,handlesAfter=0;assert(GetProcessHandleCount(GetCurrentProcess(),&handlesBefore));
 for(unsigned n=0;n<4;n++){assert(FolderBitmap::Init());FolderBitmap::Uninit();}
 assert(GetProcessHandleCount(GetCurrentProcess(),&handlesAfter)&&handlesAfter==handlesBefore);
 fixtureWicPins=false;FreeLibrary(wicModule);
 const COLORREF fill=RGB(125,19,16),edge=RGB(229,57,53);
 assert(FolderGlyph::Build(fill,edge));assert(FolderGlyph::frames.size()==13);
 HWND explorer=Window(L"CabinetWClass"),unrelated=Window(L"OtherApplication");fixtureOwner=explorer;
 enabled=true;imageListSize=&ImageList_GetIconSize;
 originalImageListDraw=[](void* self,IMAGELISTDRAWPARAMS* request)->HRESULT{Extended(request);auto standard=*request;standard.cbSize=sizeof(standard);return self?static_cast<IImageList*>(self)->Draw(&standard):ImageList_DrawIndirect(&standard)?S_OK:E_FAIL;};
 IImageList* stock=nullptr;assert(SUCCEEDED(SHGetImageList(SHIL_SMALL,__uuidof(IImageList),reinterpret_cast<void**>(&stock))));
 SHSTOCKICONINFO stockInfo{sizeof(stockInfo)};assert(SUCCEEDED(SHGetStockIconInfo(SIID_FOLDER,SHGSI_SYSICONINDEX,&stockInfo)));
 for(int size:{16,24,32,48,144,256}) {
  HDC dc=CreateCompatibleDC(nullptr);DWORD* pixels=nullptr;HBITMAP bitmap=FolderGlyph::Bitmap(size,&pixels);assert(dc&&bitmap);auto prior=SelectObject(dc,bitmap);
  alignas(IMAGELISTDRAWPARAMS) BYTE bytes[96]{};auto& request=*reinterpret_cast<IMAGELISTDRAWPARAMS*>(bytes);request.cbSize=sizeof(request);request.himl=reinterpret_cast<HIMAGELIST>(stock);request.i=stockInfo.iSysImageIndex;request.hdcDst=dc;request.cx=request.cy=size;request.rgbBk=CLR_NONE;request.rgbFg=CLR_DEFAULT;request.fStyle=ILD_TRANSPARENT|ILD_SCALE;
  auto draw=[&](bool hook){std::fill_n(pixels,size*size,0u);assert(SUCCEEDED(hook?NavigationPinHook(stock,&request):originalImageListDraw(stock,&request)));GdiFlush();return std::vector<DWORD>(pixels,pixels+size*size);};
  auto native=draw(false),themed=draw(true);assert(native!=themed);
  stockQueries=0;for(unsigned n=0;n<20;n++)assert(draw(true)==themed);assert(stockQueries==0);
  request.cbSize=96;memcpy(bytes+88,&extension,8);assert(draw(true)==themed);assert(extendedCalls>0);
  request.cbSize=104;assert(draw(true)==native);request.cbSize=sizeof(request);
  fixtureContrast=true;assert(draw(true)==native);fixtureContrast=false;
  fixtureOwner=unrelated;assert(draw(true)==native);fixtureOwner=explorer;
  enabled=false;assert(draw(true)==native);enabled=true;
  // Overlay and cropped operations are passed to the unmodified native draw.
  request.fStyle|=INDEXTOOVERLAYMASK(1);assert(draw(true)==draw(false));request.fStyle=ILD_TRANSPARENT|ILD_SCALE;
  request.xBitmap=1;assert(draw(true)==draw(false));request.xBitmap=0;
  if(size==24){int width=0,height=0;assert(ImageList_GetIconSize(request.himl,&width,&height));assert(width==height);
   if(width==size){request.cx=request.cy=0;assert(draw(true)==themed);request.cx=request.cy=size;}
  }
  // Persist only generated artwork for a byte comparison with original ICO frames.
  if(argc==2&&size==24){std::vector<DWORD> raster(size*size);FolderGlyph::Raster(raster.data(),size,false,fill,edge);FILE* file=fopen(argv[1],"wb");assert(file);assert(fwrite(raster.data(),4,raster.size(),file)==raster.size());fclose(file);}
  SelectObject(dc,prior);DeleteObject(bitmap);DeleteDC(dc);
 }
 // A custom source must retain its native rendering.
 int width=0,height=0;assert(stock->GetIconSize(&width,&height)==S_OK);
 HIMAGELIST images=ImageList_Create(width,height,ILC_COLOR32|ILC_MASK,1,0);assert(images);
 DWORD* sourcePixels=nullptr;HBITMAP source=FolderGlyph::Bitmap(width,&sourcePixels);assert(source);std::fill_n(sourcePixels,width*height,0xff14dc32u);assert(ImageList_Add(images,source,nullptr)==0);DeleteObject(source);
 HDC dc=CreateCompatibleDC(nullptr);DWORD* pixels=nullptr;HBITMAP bitmap=FolderGlyph::Bitmap(width,&pixels);auto prior=SelectObject(dc,bitmap);
 IMAGELISTDRAWPARAMS draw{sizeof(draw)};draw.himl=images;draw.i=0;draw.hdcDst=dc;draw.cx=draw.cy=width;draw.rgbBk=CLR_NONE;draw.rgbFg=CLR_DEFAULT;draw.fStyle=ILD_TRANSPARENT|ILD_SCALE;
 memset(pixels,0,width*height*4);assert(SUCCEEDED(NavigationPinHook(nullptr,&draw)));GdiFlush();std::vector<DWORD> actual(pixels,pixels+width*height);
 memset(pixels,0,width*height*4);assert(SUCCEEDED(originalImageListDraw(nullptr,&draw)));GdiFlush();assert(actual==std::vector<DWORD>(pixels,pixels+width*height));
 // Acquisition has a separate raster identity and retains caller ownership.
 originalImageListGetIcon=&ImageList_GetIcon;
 // Nested extraction restores the previous guard rather than clearing it.
 {FolderGlyph::NativeGuard outer;assert(FolderGlyph::painting);
  {FolderGlyph::NativeGuard inner;assert(FolderGlyph::painting);}assert(FolderGlyph::painting);}
 assert(!FolderGlyph::painting);
 auto nativeGetIcon=originalImageListGetIcon;
 originalImageListGetIcon=[](HIMAGELIST images,int index,UINT flags)->HICON{
  assert(FolderGlyph::painting);return ImageList_GetIcon(images,index,flags);
 };
 HICON guarded=FolderGlyph::NativeIcon(reinterpret_cast<HIMAGELIST>(stock),stockInfo.iSysImageIndex,ILD_NORMAL);
 assert(guarded&&!FolderGlyph::painting);DestroyIcon(guarded);
 {FolderGlyph::NativeGuard outer;guarded=FolderGlyph::NativeIcon(reinterpret_cast<HIMAGELIST>(stock),stockInfo.iSysImageIndex,ILD_NORMAL);assert(guarded&&FolderGlyph::painting);DestroyIcon(guarded);}
 assert(!FolderGlyph::painting);originalImageListGetIcon=nativeGetIcon;
 auto iconPixels=[](HICON icon){int size=FolderGlyph::IconSize(icon);assert(size>0);DWORD* pixels=nullptr;auto bitmap=FolderGlyph::Bitmap(size,&pixels);HDC buffer=CreateCompatibleDC(nullptr);assert(bitmap&&buffer);auto before=SelectObject(buffer,bitmap);memset(pixels,0,size*size*4);assert(DrawIconEx(buffer,0,0,icon,size,size,0,nullptr,DI_NORMAL));GdiFlush();std::vector<DWORD> copy(pixels,pixels+size*size);SecureZeroMemory(pixels,size*size*4);SelectObject(buffer,before);DeleteDC(buffer);DeleteObject(bitmap);return copy;};
 // WIC conversion borrows the input HICON. Verify exact resource-sized stock
 // matches, custom refusal, owner/accessibility boundaries and result ownership.
 IWICImagingFactory* wic=nullptr;assert(SUCCEEDED(CoCreateInstance(CLSID_WICImagingFactory,nullptr,CLSCTX_INPROC_SERVER,IID_PPV_ARGS(&wic))));
 FolderBitmap::originalConvert=[](IWICImagingFactory* factory,HICON icon,IWICBitmap** output)->HRESULT{return factory->CreateBitmapFromHICON(icon,output);};
 auto nativeConvert=FolderBitmap::originalConvert;
 auto bitmapPixels=[&](IWICBitmap* bitmap){
  UINT width=0,height=0;assert(SUCCEEDED(bitmap->GetSize(&width,&height)));
  IWICFormatConverter* converter=nullptr;assert(SUCCEEDED(wic->CreateFormatConverter(&converter)));
  assert(SUCCEEDED(converter->Initialize(bitmap,GUID_WICPixelFormat32bppPBGRA,WICBitmapDitherTypeNone,nullptr,0,WICBitmapPaletteTypeCustom)));
  std::vector<DWORD> pixels(width*height);assert(SUCCEEDED(converter->CopyPixels(nullptr,width*4,static_cast<UINT>(pixels.size()*4),reinterpret_cast<BYTE*>(pixels.data()))));converter->Release();return pixels;
 };
 auto convertedPixels=[&](HICON icon,bool reviewed){IWICBitmap* bitmap=nullptr;assert(SUCCEEDED(FolderBitmap::Convert(wic,icon,&bitmap,reviewed))&&bitmap);auto pixels=bitmapPixels(bitmap);bitmap->Release();return pixels;};
 for(unsigned open=0;open<2;open++)for(int size:{16,20,24,32,48,96,144,256}) {
  SHSTOCKICONINFO resource{sizeof(resource)};assert(SUCCEEDED(SHGetStockIconInfo(open?SIID_FOLDEROPEN:SIID_FOLDER,SHGSI_ICONLOCATION,&resource)));
  HICON borrowed=nullptr;assert(SUCCEEDED(SHDefExtractIconW(resource.szPath,resource.iIcon,0,&borrowed,nullptr,static_cast<UINT>(size)))&&borrowed);
  auto baseline=iconPixels(borrowed);unsigned expectedOpen=open;
  // Windows supplies identical open/closed resources at some sizes. That
  // identity has no observable open-state signal; the first closed identity
  // applies. Establish this from independent native extraction, not the cache.
  if(open){SHSTOCKICONINFO closed{sizeof(closed)};assert(SUCCEEDED(SHGetStockIconInfo(SIID_FOLDER,SHGSI_ICONLOCATION,&closed)));HICON closedIcon=nullptr;
   assert(SUCCEEDED(SHDefExtractIconW(closed.szPath,closed.iIcon,0,&closedIcon,nullptr,static_cast<UINT>(size)))&&closedIcon);
   if(iconPixels(closedIcon)==baseline)expectedOpen=0;DestroyIcon(closedIcon);}
  stockQueries=0;
  HICON copy=FolderGlyph::Copy(borrowed,true);assert(copy&&copy!=borrowed&&iconPixels(copy)!=baseline&&iconPixels(borrowed)==baseline);DestroyIcon(copy);
  assert(!FolderGlyph::Copy(borrowed,false));fixtureContrast=true;assert(!FolderGlyph::Copy(borrowed,true));fixtureContrast=false;
  fixtureOwner=unrelated;assert(!FolderGlyph::Copy(borrowed,true));fixtureOwner=explorer;
  enabled=false;assert(!FolderGlyph::Copy(borrowed,true));enabled=true;
  IWICBitmap* bitmap=nullptr;assert(SUCCEEDED(FolderBitmap::Convert(wic,borrowed,&bitmap,true))&&bitmap);
  UINT width=0,height=0;assert(SUCCEEDED(bitmap->GetSize(&width,&height))&&width==size&&height==size);
  auto themedPixels=bitmapPixels(bitmap);bitmap->Release();assert(iconPixels(borrowed)==baseline);
  auto frame=std::find_if(FolderGlyph::frames.begin(),FolderGlyph::frames.end(),[&](auto const& frame){return frame.size==size;});assert(frame!=FolderGlyph::frames.end());
  HICON expected=FolderGlyph::NativeIcon(frame->images[expectedOpen],0,ILD_NORMAL);
  assert(expected&&themedPixels==convertedPixels(expected,false));DestroyIcon(expected);
  auto nativePixels=convertedPixels(borrowed,false);assert(themedPixels!=nativePixels);
  fixtureContrast=true;assert(convertedPixels(borrowed,true)==nativePixels);fixtureContrast=false;
  fixtureOwner=unrelated;assert(convertedPixels(borrowed,true)==nativePixels);fixtureOwner=explorer;
  enabled=false;assert(convertedPixels(borrowed,true)==nativePixels);enabled=true;
  // Allocation failure in replacement extraction must call native once with
  // the unchanged borrowed handle and preserve the native last-error result.
  auto savedExtractor=originalImageListGetIcon;
  originalImageListGetIcon=[](HIMAGELIST,int,UINT)->HICON{throw std::bad_alloc();};
  assert(convertedPixels(borrowed,true)==nativePixels);originalImageListGetIcon=savedExtractor;
  FolderBitmap::originalConvert=[](IWICImagingFactory*,HICON input,IWICBitmap** output)->HRESULT{
   assert(GetLastError()==0x12345678);assert(input);if(output)assert(!*output);SetLastError(0x87654321);return E_ACCESSDENIED;
  };
  bitmap=nullptr;SetLastError(0x12345678);assert(FolderBitmap::Convert(wic,borrowed,&bitmap,true)==E_ACCESSDENIED&&GetLastError()==0x87654321&&!bitmap);
  SetLastError(0x12345678);assert(FolderBitmap::Convert(wic,borrowed,nullptr,true)==E_ACCESSDENIED&&GetLastError()==0x87654321);
  FolderBitmap::originalConvert=nativeConvert;
  // Native failure and null-output semantics match WIC itself.
  IWICBitmap* invalid=nullptr;HRESULT nativeFailure=wic->CreateBitmapFromHICON(nullptr,&invalid);assert(FAILED(nativeFailure)&&!invalid);
  assert(FolderBitmap::Convert(wic,nullptr,&invalid,true)==nativeFailure&&!invalid);
  assert(FolderBitmap::Convert(wic,borrowed,nullptr,true)==wic->CreateBitmapFromHICON(borrowed,nullptr));
  assert(stockQueries==0);DestroyIcon(borrowed);
 }
 // A private icon that happens to share stock dimensions must stay unchanged.
 HICON customBorrowed=FolderGlyph::NativeIcon(images,0,ILD_NORMAL);assert(customBorrowed&&!FolderGlyph::Copy(customBorrowed,true));assert(convertedPixels(customBorrowed,true)==convertedPixels(customBorrowed,false));DestroyIcon(customBorrowed);wic->Release();
 for(unsigned open=0;open<2;open++) {
  SHSTOCKICONINFO identity{sizeof(identity)};assert(SUCCEEDED(SHGetStockIconInfo(open?SIID_FOLDEROPEN:SIID_FOLDER,SHGSI_SYSICONINDEX,&identity)));
  HICON native=nullptr;assert(SUCCEEDED(stock->GetIcon(identity.iSysImageIndex,ILD_NORMAL,&native))&&native);auto baselinePixels=iconPixels(native);int size=FolderGlyph::IconSize(native);
  stockQueries=0;expectNativeRaster=true;HICON themed=FolderGlyph::Acquire(native,ILD_NORMAL,true);expectNativeRaster=false;assert(nativeRasters>0&&!FolderGlyph::painting);assert(themed&&iconPixels(themed)!=baselinePixels&&FolderGlyph::IconSize(themed)==size);assert(stockQueries==0);DestroyIcon(themed);
  // Acquiring the themed icon did not alter the original shell list.
  assert(SUCCEEDED(stock->GetIcon(identity.iSysImageIndex,ILD_NORMAL,&native))&&native);assert(iconPixels(native)==baselinePixels);
  assert(FolderGlyph::Acquire(native,ILD_NORMAL,false)==native);
  fixtureContrast=true;assert(FolderGlyph::Acquire(native,ILD_NORMAL,true)==native);fixtureContrast=false;
  fixtureOwner=unrelated;assert(FolderGlyph::Acquire(native,ILD_NORMAL,true)==native);fixtureOwner=explorer;
  enabled=false;assert(FolderGlyph::Acquire(native,ILD_NORMAL,true)==native);enabled=true;
  assert(FolderGlyph::Acquire(native,INDEXTOOVERLAYMASK(1),true)==native);
  auto originalGetIcon=originalImageListGetIcon;originalImageListGetIcon=[](HIMAGELIST,int,UINT)->HICON{return nullptr;};assert(FolderGlyph::Acquire(native,ILD_NORMAL,true)==native);originalImageListGetIcon=originalGetIcon;
  // The same list slot stops matching after a customized glyph replaces it.
  IImageList* mutableList=nullptr;assert(SUCCEEDED(stock->Clone(__uuidof(IImageList),reinterpret_cast<void**>(&mutableList)))&&mutableList);DestroyIcon(native);
  HICON acquired=nullptr;assert(SUCCEEDED(mutableList->GetIcon(identity.iSysImageIndex,ILD_NORMAL,&acquired))&&acquired);auto genericPixels=iconPixels(acquired);assert(genericPixels==baselinePixels);HICON changed=FolderGlyph::Acquire(acquired,ILD_NORMAL,true);assert(iconPixels(changed)!=genericPixels);DestroyIcon(changed);
  DWORD* customPixels=nullptr;HBITMAP custom=FolderGlyph::Bitmap(size,&customPixels);assert(custom);std::fill_n(customPixels,size*size,0xff14dc32u);assert(SUCCEEDED(mutableList->Replace(identity.iSysImageIndex,custom,nullptr)));DeleteObject(custom);
  assert(SUCCEEDED(mutableList->GetIcon(identity.iSysImageIndex,ILD_NORMAL,&acquired))&&acquired);assert(FolderGlyph::Acquire(acquired,ILD_NORMAL,true)==acquired);DestroyIcon(acquired);mutableList->Release();
  DWORD objects=GetGuiResources(GetCurrentProcess(),GR_USEROBJECTS),gdi=GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS);
  for(unsigned n=0;n<24;n++){assert(SUCCEEDED(stock->GetIcon(identity.iSysImageIndex,ILD_NORMAL,&native))&&native);themed=FolderGlyph::Acquire(native,ILD_NORMAL,true);assert(themed);DestroyIcon(themed);}
  assert(GetGuiResources(GetCurrentProcess(),GR_USEROBJECTS)==objects&&GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS)==gdi);
 }

 ImageList_Destroy(images);SelectObject(dc,prior);DeleteObject(bitmap);DeleteDC(dc);stock->Release();enabled=false;FolderGlyph::Uninit();assert(FolderGlyph::frames.empty());
 DWORD baseline=GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS);
 for(unsigned cycle=0;cycle<3;cycle++){assert(FolderGlyph::Build(fill,edge));FolderGlyph::Uninit();assert(GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS)==baseline);}
 DestroyWindow(explorer);DestroyWindow(unrelated);CoUninitialize();puts("PASS: exact stock replacement, WIC pixels at eight sizes, borrowed-icon ownership, native HRESULT/last-error passthrough, allocation fallback, both COM apartments, extended-request preservation, unknown/custom/overlay/contrast/window fallback and stable cleanup");
}
