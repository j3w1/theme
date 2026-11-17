// Synthetic loader and metadata; no injection, desktop input or restart.
#include <windows.h>
#include <cassert>
#include <cwchar>
#include <map>
#include <string>
#include <shlobj.h>
#include <filesystem>
#include <fstream>
#include <iterator>
static std::wstring diagnosticRoot;
enum class Fault {None,Known,Reparse,Alias,FileIdentity,Write,Partial,Flush,Throw};
static Fault fault=Fault::None;
static unsigned creates=0,writes=0,flushes=0;
static HRESULT WINAPI FixtureKnown(REFKNOWNFOLDERID id,DWORD flags,HANDLE token,PWSTR* result) {
 assert(id==FOLDERID_LocalAppData&&!flags&&!token);*result=nullptr;
 if(diagnosticRoot.empty()||fault==Fault::Known)return E_FAIL;
 auto size=(diagnosticRoot.size()+1)*sizeof(wchar_t);*result=static_cast<PWSTR>(CoTaskMemAlloc(size));assert(*result);
 memcpy(*result,diagnosticRoot.c_str(),size);return S_OK;
}
static HANDLE WINAPI FixtureFile(LPCWSTR name,DWORD access,DWORD sharing,LPSECURITY_ATTRIBUTES security,DWORD disposition,DWORD flags,HANDLE templateFile) {
 if(disposition==CREATE_NEW) {
  ++creates;assert(sharing==0&&(flags&FILE_FLAG_OPEN_REPARSE_POINT));
  // At the create boundary, the actual directory cannot be renamed or opened
  // for reparse mutation while the writer holds every validated ancestor.
  auto parent=diagnosticRoot+L"\\j3w1-theme\\windows\\diagnostics";
  BOOL moved=MoveFileExW(parent.c_str(),(parent+L"-moved").c_str(),0);DWORD moveError=GetLastError();
  if(moved||moveError!=ERROR_SHARING_VIOLATION)fprintf(stderr,"Fixture rename moved=%d error=%lu\n",moved,moveError);
  assert(!moved&&moveError==ERROR_SHARING_VIOLATION);
  HANDLE mutate=CreateFileW(parent.c_str(),GENERIC_WRITE,FILE_SHARE_READ|FILE_SHARE_WRITE|FILE_SHARE_DELETE,nullptr,
   OPEN_EXISTING,FILE_FLAG_BACKUP_SEMANTICS|FILE_FLAG_OPEN_REPARSE_POINT,nullptr);
  assert(mutate==INVALID_HANDLE_VALUE);
 }
 return CreateFileW(name,access,sharing,security,disposition,flags,templateFile);
}
static BOOL WINAPI FixtureIdentity(HANDLE file,LPBY_HANDLE_FILE_INFORMATION info) {
 BOOL result=GetFileInformationByHandle(file,info);
 if(result&&fault==Fault::Reparse&&(info->dwFileAttributes&FILE_ATTRIBUTE_DIRECTORY))info->dwFileAttributes|=FILE_ATTRIBUTE_REPARSE_POINT;
 if(result&&fault==Fault::FileIdentity&&!(info->dwFileAttributes&FILE_ATTRIBUTE_DIRECTORY))info->nNumberOfLinks=2;
 return result;
}
static DWORD WINAPI FixtureFinal(HANDLE file,LPWSTR text,DWORD size,DWORD flags) {
 DWORD result=GetFinalPathNameByHandleW(file,text,size,flags);
 if(result&&result<size&&fault==Fault::Alias)text[result-1]=text[result-1]==L'x'?L'y':L'x';
 return result;
}
static BOOL WINAPI FixtureWrite(HANDLE file,LPCVOID data,DWORD size,LPDWORD written,LPOVERLAPPED overlap) {
 ++writes;if(fault==Fault::Throw)throw std::bad_alloc();
 if(fault==Fault::Write){SetLastError(ERROR_DISK_FULL);return FALSE;}
 return WriteFile(file,data,fault==Fault::Partial?size/2:size,written,overlap);
}
static BOOL WINAPI FixtureFlush(HANDLE file) {++flushes;if(fault==Fault::Flush){SetLastError(ERROR_WRITE_FAULT);return FALSE;}return FlushFileBuffers(file);}
static std::map<HMODULE,std::wstring> modulePaths;
static unsigned loads=0,frees=0,hooks=0,failLoad=0;
static bool wrongPath=false,wrongVersion=false,truncatePath=false,failDirectory=false;
static bool readingFrame=false,retiredFrame=false,mixedDui=false;
static UINT WINAPI FixtureDirectory(LPWSTR path,UINT count){if(failDirectory)return count;wcscpy(path,L"C:\\Windows\\System32");return static_cast<UINT>(wcslen(path));}
static HMODULE WINAPI FixtureLoad(LPCWSTR path,HANDLE file,DWORD flags){
 assert(!file&&flags==LOAD_LIBRARY_SEARCH_SYSTEM32);++loads;if(loads==failLoad)return nullptr;
 assert(wcscmp(path,L"C:\\Windows\\System32\\ExplorerFrame.dll")==0||wcscmp(path,L"C:\\Windows\\System32\\dui70.dll")==0);
 auto module=reinterpret_cast<HMODULE>(static_cast<uintptr_t>(loads));modulePaths[module]=wrongPath?L"C:\\Other\\ExplorerFrame.dll":path;return module;
}
static BOOL WINAPI FixtureFree(HMODULE module){assert(modulePaths.erase(module)==1);++frees;return TRUE;}
static DWORD WINAPI FixtureName(HMODULE module,LPWSTR path,DWORD count){if(truncatePath)return count;auto found=modulePaths.find(module);if(found==modulePaths.end())return 0;wcscpy(path,found->second.c_str());return static_cast<DWORD>(found->second.size());}
static DWORD WINAPI FixtureVersionSize(LPCWSTR,LPDWORD){return 1;}
static BOOL WINAPI FixtureVersionInfo(LPCWSTR path,DWORD,DWORD,LPVOID){readingFrame=wcsstr(path,L"ExplorerFrame.dll")!=nullptr;return TRUE;}
static BOOL WINAPI FixtureVersionQuery(LPCVOID,LPCWSTR,LPVOID* result,PUINT size){static VS_FIXEDFILEINFO version{};version.dwFileVersionMS=wrongVersion?0:MAKELONG(0,10);version.dwFileVersionLS=MAKELONG(readingFrame?(retiredFrame?9818:9974):(mixedDui?9974:9818),26100);*result=&version;*size=sizeof(version);return TRUE;}
static BOOL Wh_SetFunctionHook(void*,void*,void**){++hooks;return TRUE;}
static PCWSTR Wh_GetStringSetting(PCWSTR){return L"#000000";}
static void Wh_FreeStringSetting(PCWSTR){}
struct WH_FIND_SYMBOL {void* address;PCWSTR symbol;};
static PCWSTR symbols[]={
 L"const UIMarqueeSelector::`vftable'{for `DirectUI::Element'}",
 L"const UIItemsView::`vftable'{for `DirectUI::HWNDElement'}",
 L"public: class DirectUI::Element * __cdecl DirectUI::Element::GetRoot(void)",
 L"public: virtual struct HWND__ * __cdecl DirectUI::HWNDElement::GetHWND(void)",
 L"public: void __cdecl DirectUI::Element::PaintBackground(struct HDC__ *,class DirectUI::Value *,struct tagRECT const &,struct tagRECT const &,struct tagRECT const &,struct tagRECT const &)",
 L"public: void __cdecl DirectUI::Element::PaintBorder(struct HDC__ *,class DirectUI::Value *,struct tagRECT *,struct tagRECT const &)"};
static unsigned symbolAt;
static HANDLE Wh_FindFirstSymbol(HMODULE module,void*,WH_FIND_SYMBOL* value){assert(modulePaths.contains(module));symbolAt=0;value->address=(void*)1;value->symbol=symbols[0];return (HANDLE)1;}
static BOOL Wh_FindNextSymbol(HANDLE,WH_FIND_SYMBOL* value){if(++symbolAt==sizeof(symbols)/sizeof(*symbols))return FALSE;value->address=(void*)1;value->symbol=symbols[symbolAt];return TRUE;}
static void Wh_FindCloseSymbol(HANDLE){}
#define GetSystemDirectoryW FixtureDirectory
#define LoadLibraryExW FixtureLoad
#define FreeLibrary FixtureFree
#define GetModuleFileNameW FixtureName
#define GetFileVersionInfoSizeW FixtureVersionSize
#define GetFileVersionInfoW FixtureVersionInfo
#define VerQueryValueW FixtureVersionQuery
#define SHGetKnownFolderPath FixtureKnown
#define CreateFileW FixtureFile
#define GetFileInformationByHandle FixtureIdentity
#define GetFinalPathNameByHandleW FixtureFinal
#define WriteFile FixtureWrite
#define FlushFileBuffers FixtureFlush
#include "../ports/windows/dist/j3w1-explorer-native.wh.cpp"
#undef CreateFileW
#undef GetFileInformationByHandle
#undef GetFinalPathNameByHandleW
#undef WriteFile
#undef FlushFileBuffers
#undef GetModuleFileNameW
#undef GetFileVersionInfoSizeW
#undef GetFileVersionInfoW
#undef VerQueryValueW
// Execute the exact generated Wh_ModInit body with synthetic API/resources.
// This fixture is extracted byte-for-byte by the existing native test runner.
#define GetProcAddress FlowGetProcAddress
#define InitMarquee FlowInitMarquee
#define DeleteObject FlowDeleteObject
#define GetModuleHandleW FlowGetModuleHandleW
namespace InitFlow {
static unsigned fail=0,glyphCalls=0,bitmapCalls=0,glyphOwned=0,bitmapOwned=0,brushOwned=0,moduleOwned=0,hookCalls=0;
static bool factoryFailure=true;
static HBRUSH backgroundBrush=nullptr;static ThemeClassFn themeClass=nullptr;
static std::atomic<bool> enabled{false};static HMODULE ownedExplorerFrame=nullptr,ownedExplorerDui=nullptr;
static bool HighContrast(){return fail==1;}
static bool ReadColor(PCWSTR key,COLORREF*) {
 unsigned stage=wcscmp(key,L"pin")==0?9:wcscmp(key,L"folderFill")==0||wcscmp(key,L"folderEdge")==0?14:2;
 return fail!=stage;
}
static bool ReadMarquee(){return fail!=10;}
static HMODULE GetModuleHandleW(LPCWSTR){return (HMODULE)1;}
static DWORD GetModuleFileNameW(HMODULE,LPWSTR text,DWORD){if(fail==3){SetLastError(ERROR_BAD_EXE_FORMAT);return 0;}wcscpy(text,L"fixture");return 7;}
static DWORD GetFileVersionInfoSizeW(LPCWSTR,LPDWORD){if(fail==4){SetLastError(ERROR_BAD_EXE_FORMAT);return 0;}return 1;}
static BOOL GetFileVersionInfoW(LPCWSTR,DWORD,DWORD,LPVOID){if(fail==5){SetLastError(ERROR_BAD_EXE_FORMAT);return FALSE;}return TRUE;}
static BOOL VerQueryValueW(LPCVOID,LPCWSTR,LPVOID* result,PUINT size) {
 static VS_FIXEDFILEINFO version{};version.dwFileVersionMS=MAKELONG(0,10);version.dwFileVersionLS=fail==7?0:MAKELONG(9974,26100);
 *result=&version;*size=sizeof(version);return fail!=6;
}
static FARPROC GetProcAddress(HMODULE,LPCSTR){if(fail==8){SetLastError(ERROR_BAD_EXE_FORMAT);return nullptr;}return reinterpret_cast<FARPROC>(1);}
struct ExplorerRenderingModules {
 HMODULE frame=nullptr,dui=nullptr;
 bool Load(){if(fail==11)return false;frame=(HMODULE)1;dui=(HMODULE)2;moduleOwned+=2;return true;}
 ~ExplorerRenderingModules(){if(frame||dui){assert(frame&&dui&&moduleOwned==2);moduleOwned=0;SetLastError(7788);}}
};
static bool InitMarquee(HMODULE,HMODULE){return fail!=12;}
static bool InitNavigationPin(){return fail!=13;}
namespace FolderGlyph {
static bool Init(COLORREF,COLORREF,HRESULT* result){++glyphCalls;*result=fail==15?RPC_E_CHANGED_MODE:S_OK;if(fail==15||fail==16)return false;++glyphOwned;return true;}
static void Uninit(){assert(glyphOwned==1);--glyphOwned;SetLastError(8899);}
}
namespace FolderBitmap {
static bool Init(HRESULT* apartment,HRESULT* factory){++bitmapCalls;*apartment=fail==17?E_OUTOFMEMORY:S_OK;if(fail==17)return false;*factory=fail==18&&factoryFailure?E_FAIL:S_OK;if(fail==18)return false;++bitmapOwned;return true;}
static void Uninit(){assert(bitmapOwned==1);--bitmapOwned;SetLastError(8899);}
}
static HBRUSH CreateSolidBrush(COLORREF){if(fail==19)return nullptr;++brushOwned;return (HBRUSH)1;}
static BOOL DeleteObject(HGDIOBJ brush){assert(brush==(HGDIOBJ)1&&brushOwned==1);--brushOwned;SetLastError(8899);return TRUE;}
static BOOL Wh_SetFunctionHook(void*,void*,void**){++hookCalls;return fail!=20;}
#include J3W1_INIT_FLOW_FILE
}
#undef GetProcAddress
#undef InitMarquee
#undef DeleteObject
#undef GetModuleHandleW
static void FailureRecords() {
 int count=0;auto args=CommandLineToArgvW(GetCommandLineW(),&count);assert(args&&count==2);diagnosticRoot=args[1];LocalFree(args);
 auto directory=std::filesystem::path(diagnosticRoot)/L"j3w1-theme"/L"windows"/L"diagnostics";
 auto file=directory/L"j3w1-explorer-native-1.8.10-init-failure.json";
 auto read=[&](){std::ifstream input(file,std::ios::binary);return std::string(std::istreambuf_iterator<char>(input),{});};
 auto clear=[&](){fault=Fault::None;creates=writes=flushes=0;std::filesystem::remove(file);};
 auto emit=[&](){SetLastError(0x12345678);bool result=InitFailure::Write(15,InitFailure::HResult,0x80010106,true,RPC_E_CHANGED_MODE,false,S_OK);assert(GetLastError()==0x12345678);return result;};
 // Missing directory never creates it. Success/no-failure never touches disk.
 assert(!emit()&&!std::filesystem::exists(directory)&&creates==0);
 std::filesystem::create_directories(directory);clear();
 {InitFailure::Record success;assert(success.Check(InitFailure::Colors,true));}
 assert(creates==0&&!std::filesystem::exists(file));
 assert(emit()&&creates==1&&writes==1&&flushes==1);
 auto first=read();assert(first.size()<1024&&first.ends_with("}\n"));
 assert(first.find("\"stage\":15,\"nativeKind\":2,\"nativeAvailable\":true,\"nativeValue\":2147549446")!=std::string::npos);
 assert(first.find("\"glyphCom\":2147549446,\"bitmapCom\":null")!=std::string::npos);
 FILETIME created{},exit{},kernel{},user{};assert(GetProcessTimes(GetCurrentProcess(),&created,&exit,&kernel,&user));
 ULARGE_INTEGER stamp{};stamp.LowPart=created.dwLowDateTime;stamp.HighPart=created.dwHighDateTime;
 assert(first.find("\"creationFiletime\":\""+std::to_string(stamp.QuadPart)+"\"")!=std::string::npos);
 assert(first.find("\"pid\":"+std::to_string(GetCurrentProcessId()))!=std::string::npos);
 assert(!emit()&&creates==2&&writes==1&&flushes==1&&read()==first);clear();
 for(unsigned stage=0;stage<=20;++stage) {
  InitFlow::fail=stage;InitFlow::glyphCalls=InitFlow::bitmapCalls=InitFlow::hookCalls=0;
  SetLastError(0x12345678);BOOL admitted=InitFlow::Wh_ModInit();DWORD preserved=GetLastError();
  assert(admitted==(stage==0)&&creates==(stage?1u:0u));
  assert(InitFlow::glyphCalls==(stage==0||stage>=15?1u:0u));
  assert(InitFlow::bitmapCalls==(stage==0||stage>=17?1u:0u));
  assert(InitFlow::hookCalls==(stage==0?20u:stage==20?1u:0u));
  DWORD expected=stage>=12?7788u:stage==3||stage==4||stage==5||stage==8?ERROR_BAD_EXE_FORMAT:0x12345678u;
  if(preserved!=expected)fprintf(stderr,"Fixture stage=%u preserved=%lu expected=%lu\n",stage,preserved,expected);
  assert(preserved==expected);
  if(stage) {
   assert(InitFlow::glyphOwned==0&&InitFlow::bitmapOwned==0&&InitFlow::brushOwned==0&&InitFlow::moduleOwned==0);
   auto record=read();assert(record.find("\"stage\":"+std::to_string(stage)+",")!=std::string::npos);
   bool native=stage==3||stage==4||stage==5||stage==8||stage==15||stage==17||stage==18;
   assert(record.find(native?"\"nativeAvailable\":true":"\"nativeAvailable\":false")!=std::string::npos);
   assert(record.find(stage<15?"\"glyphCom\":null":"\"glyphCom\":")!=std::string::npos);
  } else {
   assert(!std::filesystem::exists(file)&&InitFlow::enabled.load());
   InitFlow::FolderBitmap::Uninit();InitFlow::FolderGlyph::Uninit();InitFlow::FlowDeleteObject(InitFlow::backgroundBrush);
   InitFlow::backgroundBrush=nullptr;InitFlow::moduleOwned=0;InitFlow::ownedExplorerFrame=InitFlow::ownedExplorerDui=nullptr;
  }
  clear();
 }
 // Same bitmap admission failure with no failed HRESULT remains unavailable.
 InitFlow::fail=18;InitFlow::factoryFailure=false;assert(!InitFlow::Wh_ModInit());
 assert(read().find("\"stage\":18,\"nativeKind\":0,\"nativeAvailable\":false,\"nativeValue\":0")!=std::string::npos);
 InitFlow::factoryFailure=true;clear();
 // Every closed stage emits once; boolean-only failures never read stale GLE.
 for(unsigned stage=1;stage<=20;++stage) {
  SetLastError(0x12345678);{InitFailure::Record failure;assert(!failure.Check(static_cast<InitFailure::Stage>(stage),false));}
  assert(GetLastError()==0x12345678&&creates==1&&writes==1&&flushes==1);
  auto record=read();assert(record.find("\"stage\":"+std::to_string(stage)+",")!=std::string::npos);
  assert(record.find("\"nativeKind\":0,\"nativeAvailable\":false,\"nativeValue\":0")!=std::string::npos);clear();
 }
 SetLastError(ERROR_BAD_EXE_FORMAT);{InitFailure::Record failure;assert(!failure.Check(InitFailure::Executable,false,InitFailure::Win32));}
 assert(GetLastError()==ERROR_BAD_EXE_FORMAT&&read().find("\"nativeValue\":193")!=std::string::npos);clear();
 for(auto failure:{Fault::Known,Fault::Reparse,Fault::Alias}) {
  fault=failure;assert(!emit()&&creates==0&&!std::filesystem::exists(file));clear();
 }
 auto original=diagnosticRoot;
 for(auto suffix:{L"\\.",L"\\..",L" ",L"\\",L":stream"}) {
  diagnosticRoot=original+suffix;assert(!emit()&&creates==0);diagnosticRoot=original;clear();
 }
 // Real non-directory parent and pre-existing directory destination are refused.
 std::filesystem::remove(directory);std::ofstream(directory)<<"parent sentinel";
 assert(!emit()&&creates==0);std::filesystem::remove(directory);std::filesystem::create_directory(directory);
 std::filesystem::create_directory(file);assert(!emit()&&writes==0);clear();
 for(auto failure:{Fault::FileIdentity,Fault::Write,Fault::Partial,Fault::Flush,Fault::Throw}) {
  fault=failure;assert(!emit()&&creates==1);assert(std::filesystem::exists(file));
  auto partial=read();assert(!emit()&&creates==2&&read()==partial);clear();
  fault=failure;InitFlow::fail=15;SetLastError(0x12345678);
  assert(!InitFlow::Wh_ModInit());assert(GetLastError()==7788&&creates==1);
  assert(InitFlow::glyphOwned==0&&InitFlow::bitmapOwned==0&&InitFlow::moduleOwned==0);clear();
 }
 DWORD before=0,after=0;assert(GetProcessHandleCount(GetCurrentProcess(),&before));
 for(unsigned i=0;i<12;++i){assert(emit());clear();}
 assert(GetProcessHandleCount(GetCurrentProcess(),&after)&&before==after);
 puts("PASS: closed stages/errors, exact process identity, no success write, exclusive collision, locked ancestors, unsafe paths/identity, write/flush/exception failure and stable handles (scratch only)");
}
static void Reset(){assert(modulePaths.empty());loads=frees=hooks=failLoad=0;wrongPath=wrongVersion=truncatePath=failDirectory=retiredFrame=mixedDui=false;}
int main(){
 assert(!GetModuleHandleW(L"ExplorerFrame.dll")&&!GetModuleHandleW(L"dui70.dll"));
 {ExplorerRenderingModules modules;assert(modules.Load());assert(loads==2);assert(InitMarquee(modules.frame,modules.dui));assert(hooks==4);assert(!modules.Load());}
 assert(frees==2);Reset();
 for(unsigned failure=1;failure<=2;++failure){failLoad=failure;{ExplorerRenderingModules modules;assert(!modules.Load());}assert(loads==failure&&frees==failure-1);Reset();}
 wrongPath=true;{ExplorerRenderingModules modules;assert(!modules.Load());}assert(loads==1&&frees==1);Reset();
 truncatePath=true;{ExplorerRenderingModules modules;assert(!modules.Load());}assert(frees==1);Reset();
 failDirectory=true;{ExplorerRenderingModules modules;assert(!modules.Load());}assert(loads==0);Reset();
 wrongVersion=true;{ExplorerRenderingModules modules;assert(modules.Load());assert(!InitMarquee(modules.frame,modules.dui));assert(hooks==0);}assert(frees==2);Reset();
 retiredFrame=true;{ExplorerRenderingModules modules;assert(modules.Load());assert(!InitMarquee(modules.frame,modules.dui));assert(hooks==0);}assert(frees==2);Reset();
 mixedDui=true;{ExplorerRenderingModules modules;assert(modules.Load());assert(!InitMarquee(modules.frame,modules.dui));assert(hooks==0);}assert(frees==2);Reset();
 {ExplorerRenderingModules modules;assert(modules.Load());ownedExplorerFrame=modules.frame;ownedExplorerDui=modules.dui;modules.frame=modules.dui=nullptr;}
 assert(frees==0&&modulePaths.size()==2);ReleaseExplorerRenderingModules();assert(frees==2);ReleaseExplorerRenderingModules();assert(frees==2);Reset();
 FailureRecords();
}
