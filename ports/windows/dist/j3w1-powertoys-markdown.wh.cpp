// ==WindhawkMod==
// @id j3w1-powertoys-markdown
// @name j3w1 PowerToys Markdown preview
// @description Exact-version black and rose Markdown rendering adapter
// @version 1.1.0
// @author j3w1
// @include PowerToys.MarkdownPreviewHandler.exe
// @architecture x86-64
// @compilerOptions -lbcrypt -luser32 -lole32 -lshell32 -lshlwapi -luuid
// ==/WindhawkMod==
// ==WindhawkModSettings==
/*
- enabled: true
*/
// ==/WindhawkModSettings==
#include <windows.h>
#include <tlhelp32.h>
#include <bcrypt.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <string>
#include <vector>
#include <atomic>
#include <mutex>
#include <algorithm>
#include <limits>
#include <stdexcept>

// Only identities and offsets of the reviewed generated headers are retained.
// No upstream template, previewed document, URI or filename is embedded/logged.
struct HeaderPin {size_t length,styleOffset,styleLength;const char* sha256;};
static constexpr HeaderPin headers[]={
 {2461,175,2249,"8a07eee9ee0b2317281ad2509d57e2db301db69bca04687e76b300e44a2c602d"},
 {2476,190,2249,"9b36963064d58718d4ac74a87e15e76c1a6f9085b2802e5ba206b881ca92fc79"},
 {2452,175,2240,"449a8fe0d7c0bca0b8792cf7d9597d0702773cb3ef71daf09c783c8bc39839ab"},
 {2467,190,2240,"30bebcadec2095b34c18f9a77e85dd3327b556a6864b84b5e55bb15eafecd651"},
};
static constexpr char palette[]=R"MD(*{box-sizing:border-box}body{margin:0;font:15px/24px "SauceCodePro NFM", "Source Code Pro", "Cascadia Mono", "Consolas", "Liberation Mono", "DejaVu Sans Mono", monospace;text-align:left}.container{width:100%;max-width:min(72ch,680px);margin:auto;padding:16px;overflow-wrap:anywhere}.container>:first-child{margin-top:0}p,ul,ol,pre,blockquote,table{margin:0 0 16px}li{margin-block:4px}ul,ol{padding-left:24px}li>p{margin:0}img{max-width:100%;height:auto}h1,h2,h3,h4,h5,h6{margin:24px 0 12px;font-weight:700;text-wrap:balance}h1{font-size:20px;line-height:28px}h2{font-size:16px;line-height:24px}h3,h4,h5,h6{font-size:13px;line-height:18px}pre{padding:12px;border:1px solid;overflow-x:auto}code,tt{font-size:13px;line-height:19px;padding:2px 4px}pre code{display:block;padding:0;font:inherit;white-space:pre;overflow-wrap:normal}strong,th{font-weight:700}em{font-style:italic}hr{border:0;border-top:1px solid;margin:24px 0}table{width:100%;border-spacing:0;border-collapse:collapse}td,th{padding:8px 12px;border:1px solid;text-align:left;vertical-align:top}blockquote{margin-inline:0;padding:8px 12px;border-left:4px solid}blockquote>:last-child{margin-bottom:0}input[type=checkbox]{accent-color:#e53935}@media(forced-colors:none){html,body{background:#000000;color:#e99499}h1,h2,h3,h4,h5,h6{color:#f4eeee}hr,td,th{border-color:#2b0e0d}th{background:#160b0b}pre,code,tt{font-family:"SauceCodePro NFM", "Source Code Pro", "Cascadia Mono", "Consolas", "Liberation Mono", "DejaVu Sans Mono", monospace;color:#e99499;background:#000000;border-radius:0}pre{font-size:13px;line-height:19px;border-color:#a3676b}blockquote{background:#160b0b;color:#e99499;border-color:#e53935}a{color:#f73f35;text-decoration:underline;text-decoration-color:#dc282e}a:hover{color:#f4eeee}a:focus-visible{outline:1px dashed #e53935;outline-offset:-2px}::selection{background:#911410;color:#f4eeee}html{scrollbar-color:#420f0c #000000}})MD";
static constexpr IID coreViewIID={0x76eceacb,0x0462,0x4d94,{0xac,0x83,0x42,0x3a,0x67,0x93,0x77,0x5e}};
static std::atomic<bool> enabled{false};
static std::mutex hookMutex,filesMutex;
static std::wstring tempFolder;
static std::vector<FILE_ID_INFO> createdFiles;
using NavigateFn=HRESULT(STDMETHODCALLTYPE*)(IUnknown*,LPCWSTR);
struct BrowserPin {const char* sha256;size_t stringRva,navigateRva;};
static constexpr BrowserPin browserPins[]={
 {"b08c60a6d316ad3e50c2a1d00f146d90fca3a8da08f22aef71722ac0ccebd6b7",0x896f0,0x89650}, // 154.0.4258.37
 {"89df7d69b27dd6c17228c7319e84e22a97076cb3d68271617490f38ab204ea3f",0x896f0,0x89650}, // 154.0.4258.48
};
struct Boundary {HMODULE module=nullptr;bool attempted=false;std::atomic<bool> ready{false};NavigateFn originalString=nullptr,originalNavigate=nullptr;};
static Boundary boundaries[std::size(browserPins)];
static decltype(&LoadLibraryExW) originalLoadLibraryEx;
static decltype(&CreateFileW) originalCreateFile;

static bool HighContrast(){
 HIGHCONTRASTW value{sizeof(value)};
 return !SystemParametersInfoW(SPI_GETHIGHCONTRAST,sizeof(value),&value,0)||(value.dwFlags&HCF_HIGHCONTRASTON);
}
static bool Digest(const BYTE* bytes,size_t size,const char* expected){
 if(size>std::numeric_limits<ULONG>::max())return false;
 BCRYPT_ALG_HANDLE algorithm=nullptr;BCRYPT_HASH_HANDLE hash=nullptr;BYTE result[32]{};bool ok=false;
 if(BCryptOpenAlgorithmProvider(&algorithm,BCRYPT_SHA256_ALGORITHM,nullptr,0)>=0
  && BCryptCreateHash(algorithm,&hash,nullptr,0,nullptr,0,0)>=0){
  ok=BCryptHashData(hash,const_cast<BYTE*>(bytes),static_cast<ULONG>(size),0)>=0&&BCryptFinishHash(hash,result,sizeof(result),0)>=0;
 }
 if(hash)BCryptDestroyHash(hash);if(algorithm)BCryptCloseAlgorithmProvider(algorithm,0);
 const char hex[]="0123456789abcdef";char actual[65]{};
 for(size_t i=0;i<32;i++){actual[i*2]=hex[result[i]>>4];actual[i*2+1]=hex[result[i]&15];}
 return ok&&strcmp(actual,expected)==0;
}
static bool DigestFile(const std::wstring& path,const char* expected){
 HANDLE file=CreateFileW(path.c_str(),GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_FLAG_OPEN_REPARSE_POINT,nullptr);
 if(file==INVALID_HANDLE_VALUE)return false;
 BY_HANDLE_FILE_INFORMATION info{};BCRYPT_ALG_HANDLE algorithm=nullptr;BCRYPT_HASH_HANDLE hash=nullptr;bool ok=false;
 if(GetFileInformationByHandle(file,&info)&&!(info.dwFileAttributes&FILE_ATTRIBUTE_REPARSE_POINT)
  && BCryptOpenAlgorithmProvider(&algorithm,BCRYPT_SHA256_ALGORITHM,nullptr,0)>=0
  && BCryptCreateHash(algorithm,&hash,nullptr,0,nullptr,0,0)>=0){
  BYTE buffer[65536],result[32]{};DWORD count=0;ok=true;
  for(;;){if(!ReadFile(file,buffer,sizeof(buffer),&count,nullptr)){ok=false;break;}if(!count)break;
   if(BCryptHashData(hash,buffer,count,0)<0){ok=false;break;}}
  ok=ok&&BCryptFinishHash(hash,result,sizeof(result),0)>=0;
  const char hex[]="0123456789abcdef";char actual[65]{};
  for(size_t i=0;i<32;i++){actual[i*2]=hex[result[i]>>4];actual[i*2+1]=hex[result[i]&15];}ok=ok&&strcmp(actual,expected)==0;
 }
 if(hash)BCryptDestroyHash(hash);if(algorithm)BCryptCloseAlgorithmProvider(algorithm,0);CloseHandle(file);return ok;
}
static size_t MaximumHeader(const HeaderPin* pins=headers,size_t count=std::size(headers)){
 size_t length=0;for(size_t i=0;i<count;i++)length=std::max(length,pins[i].length);return length;
}
static const HeaderPin* MatchHeader(const char* prefix,size_t size,const HeaderPin* pins=headers,size_t count=std::size(headers)){
 for(size_t i=0;i<count;i++){const auto& pin=pins[i];
  if(pin.styleOffset>pin.length||pin.styleLength>pin.length-pin.styleOffset)continue;
  if(size>=pin.length&&Digest(reinterpret_cast<const BYTE*>(prefix),pin.length,pin.sha256))return &pin;}
 return nullptr;
}
static std::string Style(const HeaderPin& pin){
 std::string style=palette;
 if(style.size()>pin.styleLength)throw std::length_error("Palette exceeds admitted CSS extent");
 style.resize(pin.styleLength,' ');return style;
}
static bool IsCoreView(IUnknown* view){
 if(!view)return false;IUnknown* core=nullptr;HRESULT result=view->QueryInterface(coreViewIID,reinterpret_cast<void**>(&core));
 if(core)core->Release();return SUCCEEDED(result)&&core;
}
static bool PaletteString(LPCWSTR html,std::wstring& themed,const HeaderPin* pins=headers,size_t count=std::size(headers)){
 if(!html)return false;
 size_t length=wcsnlen(html,MaximumHeader(pins,count));std::string prefix;prefix.reserve(length);
 for(size_t i=0;i<length;i++){if(html[i]>127)return false;prefix+=static_cast<char>(html[i]);}
 const auto* pin=MatchHeader(prefix.data(),prefix.size(),pins,count);if(!pin)return false;
 // NavigateToString consumes this LPCWSTR synchronously. The complete suffix,
 // including all Unicode document data, is passed through unchanged.
    themed=html;std::string style=Style(*pin);
 themed.replace(pin->styleOffset,pin->styleLength,std::wstring(style.begin(),style.end()));return true;
}
template<size_t Index> static HRESULT STDMETHODCALLTYPE StringHook(IUnknown* view,LPCWSTR html){
 auto& boundary=boundaries[Index];
 if(enabled&&boundary.ready&&!HighContrast()&&IsCoreView(view)){
  try{std::wstring themed;if(PaletteString(html,themed))return boundary.originalString(view,themed.c_str());}catch(...){}
 }
 return boundary.originalString(view,html);
}
static bool GuidHtml(const wchar_t* leaf){
 if(!leaf||wcslen(leaf)!=41||_wcsicmp(leaf+36,L".html"))return false;
 for(size_t i=0;i<36;i++){
  if(i==8||i==13||i==18||i==23){if(leaf[i]!=L'-')return false;}
  else if(!((leaf[i]>=L'0'&&leaf[i]<=L'9')||(leaf[i]>=L'a'&&leaf[i]<=L'f')||(leaf[i]>=L'A'&&leaf[i]<=L'F')))return false;
 }return true;
}
static bool TempPath(const std::wstring& path){
 return !tempFolder.empty()&&path.size()>tempFolder.size()&&_wcsnicmp(path.c_str(),tempFolder.c_str(),tempFolder.size())==0
  &&GuidHtml(path.c_str()+tempFolder.size());
}
static bool NoReparseParents(const std::wstring& path){
 if(path.size()<4||path[1]!=L':'||path[2]!=L'\\')return false;
 for(size_t i=3;i<path.size();i++)if(path[i]==L'\\'){
  DWORD attributes=GetFileAttributesW(path.substr(0,i).c_str());
  if(attributes==INVALID_FILE_ATTRIBUTES||!(attributes&FILE_ATTRIBUTE_DIRECTORY)||(attributes&FILE_ATTRIBUTE_REPARSE_POINT))return false;
 }return true;
}
static bool FileIdentity(HANDLE file,const std::wstring& path,FILE_ID_INFO& identity){
 BY_HANDLE_FILE_INFORMATION info{};wchar_t final[32768]{};
 DWORD length=GetFinalPathNameByHandleW(file,final,32768,FILE_NAME_NORMALIZED|VOLUME_NAME_DOS);
 std::wstring expected=L"\\\\?\\"+path;
 return length&&length<32768&&_wcsicmp(final,expected.c_str())==0&&NoReparseParents(path)
  &&GetFileInformationByHandle(file,&info)&&!(info.dwFileAttributes&(FILE_ATTRIBUTE_REPARSE_POINT|FILE_ATTRIBUTE_DIRECTORY))
  &&info.nNumberOfLinks==1&&GetFileInformationByHandleEx(file,FileIdInfo,&identity,sizeof(identity));
}
static bool SameIdentity(const FILE_ID_INFO& a,const FILE_ID_INFO& b){return a.VolumeSerialNumber==b.VolumeSerialNumber&&memcmp(&a.FileId,&b.FileId,sizeof(a.FileId))==0;}
static bool CreatedHere(const FILE_ID_INFO& id){std::lock_guard lock(filesMutex);return std::any_of(createdFiles.begin(),createdFiles.end(),[&](const auto& item){return SameIdentity(item,id);});}
static HANDLE WINAPI CreateHook(LPCWSTR path,DWORD access,DWORD share,LPSECURITY_ATTRIBUTES security,DWORD disposition,DWORD flags,HANDLE model){
 HANDLE file=originalCreateFile(path,access,share,security,disposition,flags,model);DWORD error=GetLastError();
 if(file!=INVALID_HANDLE_VALUE&&path&&enabled&&(access&GENERIC_WRITE)&&(disposition==CREATE_NEW||disposition==CREATE_ALWAYS)
  &&error!=ERROR_ALREADY_EXISTS){try{FILE_ID_INFO id{};if(TempPath(path)&&FileIdentity(file,path,id)){
   std::lock_guard lock(filesMutex);if(createdFiles.size()==64)createdFiles.erase(createdFiles.begin());createdFiles.push_back(id);
  }}catch(...){}
 }SetLastError(error);return file;
}
enum class FilePaletteResult { unchanged, changed, restorationFailed };
static FilePaletteResult PaletteFile(const std::wstring& path,const HeaderPin* pins=headers,size_t count=std::size(headers)){
 if(!TempPath(path)||!NoReparseParents(path))return FilePaletteResult::unchanged;
 HANDLE file=CreateFileW(path.c_str(),GENERIC_READ|GENERIC_WRITE,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_FLAG_OPEN_REPARSE_POINT,nullptr);
 if(file==INVALID_HANDLE_VALUE)return FilePaletteResult::unchanged;FilePaletteResult result=FilePaletteResult::unchanged;
 try{FILE_ID_INFO id{};LARGE_INTEGER before{};
  if(FileIdentity(file,path,id)&&CreatedHere(id)&&GetFileSizeEx(file,&before)&&before.QuadPart>1500000){
   std::vector<char> prefix(MaximumHeader(pins,count)+3);DWORD read=0;
   if(ReadFile(file,prefix.data(),static_cast<DWORD>(prefix.size()),&read,nullptr)){
    size_t bom=read>=3&&memcmp(prefix.data(),"\xef\xbb\xbf",3)==0?3:0;
    if(const auto* pin=MatchHeader(prefix.data()+bom,read-bom,pins,count)){
     std::string style=Style(*pin);LARGE_INTEGER position{};position.QuadPart=bom+pin->styleOffset;DWORD written=0;
     if(SetFilePointerEx(file,position,nullptr,FILE_BEGIN)){
      bool changed=WriteFile(file,style.data(),static_cast<DWORD>(style.size()),&written,nullptr)&&written==style.size();
      if(changed)result=FilePaletteResult::changed;
      else{DWORD restored=0;bool restore=SetFilePointerEx(file,position,nullptr,FILE_BEGIN)
       &&WriteFile(file,prefix.data()+position.QuadPart,static_cast<DWORD>(pin->styleLength),&restored,nullptr)&&restored==pin->styleLength;
       if(!restore){result=FilePaletteResult::restorationFailed;Wh_Log(L"Markdown temporary CSS restoration failed (%lu)",GetLastError());}}
     }
    }
   }
  }
 }catch(...){}CloseHandle(file);return result;
}
template<size_t Index> static HRESULT STDMETHODCALLTYPE NavigateHook(IUnknown* view,LPCWSTR uri){
 auto& boundary=boundaries[Index];
 if(enabled&&boundary.ready&&!HighContrast()&&IsCoreView(view)&&uri&&_wcsnicmp(uri,L"file:///",8)==0){
  try{wchar_t path[32768]{};DWORD length=32768;if(SUCCEEDED(PathCreateFromUrlW(uri,path,&length,0))
   &&PaletteFile(path)==FilePaletteResult::restorationFailed)return E_FAIL;}catch(...){}
 }
 // The original URI, Navigate call, resource filters and navigation handlers
 // remain unchanged. Only admitted CSS bytes in the host's own new temp file
 // can be written; CSP, document bytes and file length are never changed.
 return boundary.originalNavigate(view,uri);
}
template<size_t Index> static bool HookBoundary(HMODULE module){
 auto& boundary=boundaries[Index];const auto& pin=browserPins[Index];
 if(boundary.attempted)return boundary.module==module&&boundary.ready;
 boundary.module=module;boundary.attempted=true;
 auto base=reinterpret_cast<BYTE*>(module);
 // Each complete native-module digest has independently observed public COM
 // entry points and its own original calls. A second loaded runtime cannot
 // overwrite another runtime's trampoline or authorize an unknown module.
 bool ready=Wh_SetFunctionHook(base+pin.stringRva,reinterpret_cast<void*>(StringHook<Index>),reinterpret_cast<void**>(&boundary.originalString))
  &&Wh_SetFunctionHook(base+pin.navigateRva,reinterpret_cast<void*>(NavigateHook<Index>),reinterpret_cast<void**>(&boundary.originalNavigate));
 boundary.ready=ready;return ready;
}
static bool InstallBoundary(HMODULE module){
 if(!module)return false;std::lock_guard lock(hookMutex);
 wchar_t path[32768]{};DWORD length=GetModuleFileNameW(module,path,32768);
 if(!length||length>=32768)return false;
 for(size_t index=0;index<std::size(browserPins);index++)if(DigestFile(path,browserPins[index].sha256))switch(index){
  case 0:return HookBoundary<0>(module);
  case 1:return HookBoundary<1>(module);
 }
 return false;
}
static void ExistingBoundaries(){
 HANDLE snapshot=CreateToolhelp32Snapshot(TH32CS_SNAPMODULE,GetCurrentProcessId());if(snapshot==INVALID_HANDLE_VALUE)return;
 MODULEENTRY32W entry{sizeof(entry)};
 if(Module32FirstW(snapshot,&entry))do {
  if(_wcsicmp(entry.szModule,L"EmbeddedBrowserWebView.dll")==0)InstallBoundary(entry.hModule);
 }while(Module32NextW(snapshot,&entry));
 CloseHandle(snapshot);
}
static HMODULE WINAPI LoadHook(LPCWSTR path,HANDLE file,DWORD flags){
 HMODULE module=originalLoadLibraryEx(path,file,flags);DWORD error=GetLastError();
 if(module&&!(flags&(LOAD_LIBRARY_AS_DATAFILE|LOAD_LIBRARY_AS_IMAGE_RESOURCE|DONT_RESOLVE_DLL_REFERENCES))){
  try{wchar_t name[32768]{};DWORD length=GetModuleFileNameW(module,name,32768);
   if(length&&length<32768){const wchar_t* leaf=wcsrchr(name,L'\\');
    if(leaf&&_wcsicmp(leaf+1,L"EmbeddedBrowserWebView.dll")==0&&InstallBoundary(module))Wh_ApplyHookOperations();}
  }catch(...){}
 }SetLastError(error);return module;
}
BOOL Wh_ModInit(){
 wchar_t exe[32768]{};DWORD length=GetModuleFileNameW(nullptr,exe,32768);if(!length||length>=32768||HighContrast())return FALSE;
 std::wstring folder=exe;auto split=folder.find_last_of(L'\\');
 if(split==std::wstring::npos||_wcsicmp(folder.c_str()+split+1,L"PowerToys.MarkdownPreviewHandler.exe"))return FALSE;
 folder.resize(split);
 if(!DigestFile(exe,"d48704360aa8c8d5a3f572a055b176d50d58206f386cda49b2760beb3fd00cd9")||!DigestFile(folder+L"\\PowerToys.MarkdownPreviewHandler.dll","e47fcc38944ab5920aa49a31a2d0fef212865d1f5a62a65a08012a1767bed9cc")
  ||!DigestFile(folder+L"\\PowerToys.FilePreviewCommon.dll","35cb5f5e8e1d201d22db5d6b956195c04ae1a79469d36f25b90b6eeee6240ab7"))return FALSE;
 PWSTR low=nullptr;if(FAILED(SHGetKnownFolderPath(FOLDERID_LocalAppDataLow,0,nullptr,&low)))return FALSE;
 tempFolder=low;CoTaskMemFree(low);tempFolder+=L"\\Microsoft\\PowerToys\\MarkdownPreview-Temp\\";
 enabled=Wh_GetIntSetting(L"enabled")!=0;
 ExistingBoundaries();
 return Wh_SetFunctionHook(reinterpret_cast<void*>(LoadLibraryExW),reinterpret_cast<void*>(LoadHook),reinterpret_cast<void**>(&originalLoadLibraryEx))
  &&Wh_SetFunctionHook(reinterpret_cast<void*>(CreateFileW),reinterpret_cast<void*>(CreateHook),reinterpret_cast<void**>(&originalCreateFile));
}
void Wh_ModSettingsChanged(){enabled=Wh_GetIntSetting(L"enabled")!=0;}
void Wh_ModUninit(){enabled=false;std::lock_guard lock(filesMutex);createdFiles.clear();}
