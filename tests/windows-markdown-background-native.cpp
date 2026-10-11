// Offscreen Controller2 ownership regression. No documents, desktop input or capture.
#include <windows.h>
#include <cassert>
#include <cstdio>
static BOOL Wh_SetFunctionHook(void* function,void*,void** original){*original=function;return TRUE;}
static BOOL Wh_ApplyHookOperations(){return TRUE;}
static int Wh_GetIntSetting(const wchar_t*){return 1;}
template<class... Args> static void Wh_Log(const wchar_t*,Args...){}
#include "../ports/windows/dist/j3w1-powertoys-markdown.wh.cpp"
struct FakeController {void** table;unsigned refs=1;BackgroundColor color{0,255,255,255};bool failRead=false,failWrite=false,failClose=false;};
static ULONG STDMETHODCALLTYPE FakeAdd(IUnknown* object){return ++reinterpret_cast<FakeController*>(object)->refs;}
static ULONG STDMETHODCALLTYPE FakeRelease(IUnknown* object){auto value=reinterpret_cast<FakeController*>(object);assert(value->refs>0);return --value->refs;}
static HRESULT STDMETHODCALLTYPE FakeQuery(IUnknown* object,REFIID iid,void** output){*output=nullptr;if(iid!=controller2IID)return E_NOINTERFACE;*output=object;FakeAdd(object);return S_OK;}
static HRESULT STDMETHODCALLTYPE FakeGet(IUnknown* object,BackgroundColor* output){auto value=reinterpret_cast<FakeController*>(object);if(value->failRead)return E_FAIL;*output=value->color;return S_OK;}
static HRESULT STDMETHODCALLTYPE FakeSet(IUnknown* object,BackgroundColor color){auto value=reinterpret_cast<FakeController*>(object);if(value->failWrite)return E_FAIL;value->color=color;return S_OK;}
static HRESULT STDMETHODCALLTYPE FakeClose(IUnknown* object){return reinterpret_cast<FakeController*>(object)->failClose?E_FAIL:S_OK;}
int main(){
 constexpr size_t index=2;static_assert(std::size(browserPins)>index);assert(browserPins[index].backgroundGetterRva==0x58e50);assert(browserPins[index].backgroundSetterRva==0x58f10);assert(browserPins[index].closeRva==0x57380);
 void* table[28]{};table[0]=reinterpret_cast<void*>(FakeQuery);table[1]=reinterpret_cast<void*>(FakeAdd);table[2]=reinterpret_cast<void*>(FakeRelease);table[26]=reinterpret_cast<void*>(FakeGet);table[27]=reinterpret_cast<void*>(FakeSet);
 auto& boundary=boundaries[index];boundary.ready=true;boundary.getBackground=FakeGet;boundary.publicBackground=FakeSet;boundary.originalBackground=FakeSet;boundary.originalClose=FakeClose;
 backgroundMessage=RegisterWindowMessageW(L"j3w1-markdown-background-offscreen-regression");assert(backgroundMessage);enabled=true;
 FakeController controller{table};auto object=reinterpret_cast<IUnknown*>(&controller);
 assert(SUCCEEDED(BackgroundHook<index>(object,{0,255,255,255})));assert(SameBackground(controller.color,browserCanvas));assert(controller.refs==2);assert(backgroundThread&&backgroundThread->controllers.size()==1);
 // Failed restoration retains its receipt and reference until retry succeeds.
 controller.failWrite=true;assert(!RestoreControllers(*backgroundThread));assert(controller.refs==2&&backgroundThread->controllers.size()==1);
 controller.failWrite=false;assert(RestoreControllers(*backgroundThread));assert(controller.refs==1&&TransparentHostBackground(controller.color));
 assert(SUCCEEDED(BackgroundHook<index>(object,{0,255,255,255})));controller.failRead=true;assert(!RestoreControllers(*backgroundThread));assert(controller.refs==2);
 controller.failRead=false;assert(RestoreControllers(*backgroundThread));assert(controller.refs==1);
 assert(SUCCEEDED(BackgroundHook<index>(object,{0,255,255,255})));
 controller.color={255,17,23,31};assert(RestoreControllers(*backgroundThread));assert(controller.refs==1&&SameBackground(controller.color,{255,17,23,31}));
 // An explicit later host request releases ownership and remains unchanged.
 assert(SUCCEEDED(BackgroundHook<index>(object,{0,255,255,255})));
 assert(SUCCEEDED(BackgroundHook<index>(object,{255,8,9,10})));assert(controller.refs==1&&SameBackground(controller.color,{255,8,9,10}));
 // Retired views cannot consume capacity across repeated Close calls.
 for(unsigned i=0;i<100;i++){
  assert(SUCCEEDED(BackgroundHook<index>(object,{0,255,255,255})));assert(controller.refs==2);
  assert(SUCCEEDED(BackgroundCloseHook<index>(object)));assert(controller.refs==1&&backgroundThread->controllers.empty());
 }
 assert(SUCCEEDED(BackgroundHook<index>(object,{0,255,255,255})));controller.failClose=true;
 assert(FAILED(BackgroundCloseHook<index>(object))&&controller.refs==2&&backgroundThread->controllers.size()==1);
 controller.failClose=false;assert(SUCCEEDED(BackgroundCloseHook<index>(object))&&controller.refs==1);
 // Capacity is a refusal boundary for simultaneously live controllers.
 std::vector<FakeController> live(33);for(auto& value:live)value.table=table;
 for(auto& value:live)assert(SUCCEEDED(BackgroundHook<index>(reinterpret_cast<IUnknown*>(&value),{0,255,255,255})));
 assert(backgroundThread->controllers.size()==32&&live.back().refs==1&&TransparentHostBackground(live.back().color));
 assert(RestoreControllers(*backgroundThread));for(auto& value:live)assert(value.refs==1&&TransparentHostBackground(value.color));
 // Unknown interfaces and non-host transparent colors pass through.
 void* unknownTable[28]{};std::copy(std::begin(table),std::end(table),std::begin(unknownTable));unknownTable[26]=nullptr;
 FakeController unknown{unknownTable};assert(SUCCEEDED(BackgroundHook<index>(reinterpret_cast<IUnknown*>(&unknown),{0,255,255,255})));assert(unknown.refs==1&&TransparentHostBackground(unknown.color));
 assert(SUCCEEDED(BackgroundHook<index>(object,{0,1,2,3})));assert(controller.refs==1&&SameBackground(controller.color,{0,1,2,3}));
 // A disabled adapter leaves subsequent requests native and restores owned views.
 assert(SUCCEEDED(BackgroundHook<index>(object,{0,255,255,255})));enabled=false;
 assert(RestoreControllers(*backgroundThread));assert(controller.refs==1&&TransparentHostBackground(controller.color));
 RestoreBackgroundThreads();assert(!backgroundThread&&backgroundChannels.empty());
 // Environment changes are local and preserve preexisting and later values.
 wchar_t saved[32768]{};SetLastError(0);DWORD size=GetEnvironmentVariableW(backgroundEnvironmentKey,saved,std::size(saved));bool existed=size||GetLastError()!=ERROR_ENVVAR_NOT_FOUND;assert(size<std::size(saved));
 SetEnvironmentVariableW(backgroundEnvironmentKey,L"owner-existing");UpdateBackgroundEnvironment(true);assert(!backgroundEnvironmentOwned);
 SetEnvironmentVariableW(backgroundEnvironmentKey,nullptr);UpdateBackgroundEnvironment(true);assert(backgroundEnvironmentOwned);UpdateBackgroundEnvironment(false);assert(!backgroundEnvironmentOwned);
 SetLastError(0);assert(GetEnvironmentVariableW(backgroundEnvironmentKey,nullptr,0)==0&&GetLastError()==ERROR_ENVVAR_NOT_FOUND);
 UpdateBackgroundEnvironment(true);assert(backgroundEnvironmentOwned);SetEnvironmentVariableW(backgroundEnvironmentKey,L"host-later");UpdateBackgroundEnvironment(false);assert(!backgroundEnvironmentOwned);
 wchar_t current[64]{};assert(GetEnvironmentVariableW(backgroundEnvironmentKey,current,std::size(current))&&wcscmp(current,L"host-later")==0);
 // A later override also governs future setter admission, before unload.
 SetEnvironmentVariableW(backgroundEnvironmentKey,nullptr);UpdateBackgroundEnvironment(true);assert(backgroundEnvironmentOwned);
 SetEnvironmentVariableW(backgroundEnvironmentKey,L"host-later");enabled=true;
 assert(SUCCEEDED(BackgroundHook<index>(object,{0,255,255,255})));
 assert(!backgroundEnvironmentOwned&&controller.refs==1&&TransparentHostBackground(controller.color));
 UpdateBackgroundEnvironment(false);
 assert(GetEnvironmentVariableW(backgroundEnvironmentKey,current,std::size(current))&&wcscmp(current,L"host-later")==0);
 SetEnvironmentVariableW(backgroundEnvironmentKey,nullptr);UpdateBackgroundEnvironment(true);
 assert(backgroundEnvironmentOwned&&!BackgroundOverrideExists());
 UpdateBackgroundEnvironment(false);RestoreBackgroundThreads();
 assert(SetEnvironmentVariableW(backgroundEnvironmentKey,existed?saved:nullptr));
 puts("Markdown background ownership, close retirement, refusal, failure/retry and process-local defaults passed");
}
