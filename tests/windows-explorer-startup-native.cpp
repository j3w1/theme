// Synthetic loader and metadata; no injection, desktop input or restart.
#include <windows.h>
#include <cassert>
#include <cwchar>
#include <map>
#include <string>
static std::map<HMODULE,std::wstring> modulePaths;
static unsigned loads=0,frees=0,hooks=0,failLoad=0;
static bool wrongPath=false,wrongVersion=false,truncatePath=false,failDirectory=false;
static UINT WINAPI FixtureDirectory(LPWSTR path,UINT count){if(failDirectory)return count;wcscpy(path,L"C:\\Windows\\System32");return static_cast<UINT>(wcslen(path));}
static HMODULE WINAPI FixtureLoad(LPCWSTR path,HANDLE file,DWORD flags){
 assert(!file&&flags==LOAD_LIBRARY_SEARCH_SYSTEM32);++loads;if(loads==failLoad)return nullptr;
 assert(wcscmp(path,L"C:\\Windows\\System32\\ExplorerFrame.dll")==0||wcscmp(path,L"C:\\Windows\\System32\\dui70.dll")==0);
 auto module=reinterpret_cast<HMODULE>(static_cast<uintptr_t>(loads));modulePaths[module]=wrongPath?L"C:\\Other\\ExplorerFrame.dll":path;return module;
}
static BOOL WINAPI FixtureFree(HMODULE module){assert(modulePaths.erase(module)==1);++frees;return TRUE;}
static DWORD WINAPI FixtureName(HMODULE module,LPWSTR path,DWORD count){if(truncatePath)return count;auto found=modulePaths.find(module);if(found==modulePaths.end())return 0;wcscpy(path,found->second.c_str());return static_cast<DWORD>(found->second.size());}
static DWORD WINAPI FixtureVersionSize(LPCWSTR,LPDWORD){return 1;}
static BOOL WINAPI FixtureVersionInfo(LPCWSTR,DWORD,DWORD,LPVOID){return TRUE;}
static BOOL WINAPI FixtureVersionQuery(LPCVOID,LPCWSTR,LPVOID* result,PUINT size){static VS_FIXEDFILEINFO version{};version.dwFileVersionMS=wrongVersion?0:MAKELONG(0,10);version.dwFileVersionLS=MAKELONG(9549,26100);*result=&version;*size=sizeof(version);return TRUE;}
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
#include "../ports/windows/dist/j3w1-explorer-native.wh.cpp"
static void Reset(){assert(modulePaths.empty());loads=frees=hooks=failLoad=0;wrongPath=wrongVersion=truncatePath=failDirectory=false;}
int main(){
 assert(!GetModuleHandleW(L"ExplorerFrame.dll")&&!GetModuleHandleW(L"dui70.dll"));
 {ExplorerRenderingModules modules;assert(modules.Load());assert(loads==2);assert(InitMarquee(modules.frame,modules.dui));assert(hooks==4);assert(!modules.Load());}
 assert(frees==2);Reset();
 for(unsigned failure=1;failure<=2;++failure){failLoad=failure;{ExplorerRenderingModules modules;assert(!modules.Load());}assert(loads==failure&&frees==failure-1);Reset();}
 wrongPath=true;{ExplorerRenderingModules modules;assert(!modules.Load());}assert(loads==1&&frees==1);Reset();
 truncatePath=true;{ExplorerRenderingModules modules;assert(!modules.Load());}assert(frees==1);Reset();
 failDirectory=true;{ExplorerRenderingModules modules;assert(!modules.Load());}assert(loads==0);Reset();
 wrongVersion=true;{ExplorerRenderingModules modules;assert(modules.Load());assert(!InitMarquee(modules.frame,modules.dui));assert(hooks==0);}assert(frees==2);Reset();
 {ExplorerRenderingModules modules;assert(modules.Load());ownedExplorerFrame=modules.frame;ownedExplorerDui=modules.dui;modules.frame=modules.dui=nullptr;}
 assert(frees==0&&modulePaths.size()==2);ReleaseExplorerRenderingModules();assert(frees==2);ReleaseExplorerRenderingModules();assert(frees==2);Reset();
}
