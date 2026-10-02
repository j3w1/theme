// Synthetic host: no app injection, document reads, visible windows or input.
#include <windows.h>
#include <cassert>
#include <cstdio>
#include <cstring>
static unsigned hookCall = 0, failHook = 0;
static BOOL Wh_SetFunctionHook(void*, void*, void**) { return ++hookCall != failHook; }
static BOOL Wh_ApplyHookOperations() { return TRUE; }
static int setting = 1;
static int Wh_GetIntSetting(PCWSTR) { return setting; }
static unsigned failEventAt=0,eventCalls=0;static bool failWorker=false;static HANDLE failWaitHandle=nullptr;
static HANDLE WINAPI TestCreateEvent(LPSECURITY_ATTRIBUTES security,BOOL manual,BOOL initial,LPCWSTR name){if(failEventAt&&++eventCalls==failEventAt)return nullptr;return ::CreateEventW(security,manual,initial,name);}
static HANDLE WINAPI TestCreateThread(LPSECURITY_ATTRIBUTES security,SIZE_T stack,LPTHREAD_START_ROUTINE entry,LPVOID data,DWORD flags,LPDWORD id){if(failWorker)return nullptr;return ::CreateThread(security,stack,entry,data,flags,id);}
static DWORD WINAPI TestWait(HANDLE handle,DWORD timeout){if(failWaitHandle&&handle==failWaitHandle){failWaitHandle=nullptr;return WAIT_TIMEOUT;}return ::WaitForSingleObject(handle,timeout);}
#define CreateEventW TestCreateEvent
#define CreateThread TestCreateThread
#define WaitForSingleObject TestWait
#if J3W1_TEST_PAINT
#include "../ports/windows/dist/j3w1-paint-chrome.wh.cpp"
#else
#include "../ports/windows/dist/j3w1-notepad-chrome.wh.cpp"
#endif
static DWORD Handles() {
    DWORD result = 0;
    assert(GetProcessHandleCount(GetCurrentProcess(), &result));
    return result;
}
static void Start(bool completed = false) {
    enabled = true;
    factoryReady = completed;
    dispatchMessage = RegisterWindowMessageW(L"j3w1-modern-islands-lifetime-check");
    stopDiscovery = CreateEventW(nullptr, TRUE, FALSE, nullptr);
    assert(stopDiscovery && dispatchMessage);
    Wh_ModAfterInit();
    assert(discovery);
    assert(EnsureChannel());
    assert(uiState && IsWindow(uiState->channel));
    assert(channels.size() == 1);
    Schedule();
    assert(uiState->queued);
}
static void Stop() {
    Wh_ModUninit();
    assert(!discovery && !stopDiscovery && !uiState && channels.empty());
}
int main(int argc, char** argv) {
    assert(argc == 2);
    if(strcmp(argv[1],"backing-admission") == 0) {
        assert(PaintBackingAdmission(L"PaintUI.AppChrome",L"Microsoft.UI.Xaml.Controls.Grid",1,true));
        assert(!PaintBackingAdmission(L"PaintUI.Canvas",L"Microsoft.UI.Xaml.Controls.Grid",1,true));
        assert(!PaintBackingAdmission(L"Microsoft.UI.Xaml.Controls.UserControl",L"Microsoft.UI.Xaml.Controls.Grid",1,true));
        assert(!PaintBackingAdmission(L"PaintUI.AppChrome",L"PaintUI.D2DSwapChainPanel",1,true));
        assert(!PaintBackingAdmission(L"PaintUI.AppChrome",L"Microsoft.UI.Xaml.Controls.Grid",2,true));
        assert(!PaintBackingAdmission(L"PaintUI.AppChrome",L"Microsoft.UI.Xaml.Controls.Grid",1,false));
        puts("PASS: exact opaque Paint backing and document/cross-root rejection");return 0;
    }
    if(strcmp(argv[1],"backdrop-passthrough") == 0) {
        WNDCLASSW type{};type.lpfnWndProc=DefWindowProcW;type.hInstance=GetModuleHandleW(nullptr);
#if J3W1_TEST_PAINT
        type.lpszClassName=L"MSPaintApp";
#else
        type.lpszClassName=L"Notepad";
#endif
        assert(RegisterClassW(&type));
        HWND window=CreateWindowExW(0,type.lpszClassName,L"",0,0,0,20,20,nullptr,nullptr,type.hInstance,nullptr);
        assert(window&&CaptionWindow(window));
        static DWORD attributeSeen=0,valueSeen=0;static unsigned calls=0;
        originalDwmSet=+[](HWND,DWORD attribute,LPCVOID value,DWORD size)->HRESULT {
            assert(value&&size==sizeof(DWORD));attributeSeen=attribute;memcpy(&valueSeen,value,size);++calls;return S_OK;
        };
        // The real generated hook must leave existing and later app backdrop
        // requests untouched, independently of its theme activation state.
        for(bool active:{false,true})for(DWORD backdrop:{DWORD(DWMSBT_MAINWINDOW),DWORD(DWMSBT_TABBEDWINDOW),DWORD(DWMSBT_NONE)}) {
            enabled=active;assert(SUCCEEDED(DwmCaptionHook(window,DWMWA_SYSTEMBACKDROP_TYPE,&backdrop,sizeof(backdrop))));
            assert(attributeSeen==DWMWA_SYSTEMBACKDROP_TYPE&&valueSeen==backdrop);
        }
        assert(calls==6);assert(DestroyWindow(window));assert(UnregisterClassW(type.lpszClassName,type.hInstance));
        puts("PASS: native backdrop requests preserved in active and inactive adapter states");return 0;
    }
    if(strcmp(argv[1], "discovery-admission") == 0) {
#if J3W1_TEST_PAINT
        assert(DiscoveryAdmission(L"PaintUI.AppChrome",true,true));
        assert(!DiscoveryAdmission(L"PaintUI.AppChrome",false,true));
        assert(!DiscoveryAdmission(L"PaintUI.AppChrome",true,false));
        for(auto rejected:{L"PaintUI.D2DSwapChainPanel",L"PaintUI.ColorRadioButton",L"PaintUI.ItemHoverGridView",L"Microsoft.UI.Xaml.Controls.Grid",L"NotepadXamlUI.MainMenuBar",L"PaintUI.AppChromeExtra"})assert(!DiscoveryAdmission(rejected,true,true));
#else
        assert(DiscoveryAdmission(L"NotepadXamlUI.MainMenuBar",true,true));
        assert(!DiscoveryAdmission(L"NotepadXamlUI.MainMenuBar",false,true));
        assert(!DiscoveryAdmission(L"NotepadXamlUI.MainMenuBar",true,false));
        for(auto rejected:{L"NotepadXamlUI.Document",L"Microsoft.UI.Xaml.Controls.Grid",L"PaintUI.AppChrome",L"NotepadXamlUI.MainMenuBarExtra"})assert(!DiscoveryAdmission(rejected,true,true));
#endif
        winrt::init_apartment(winrt::apartment_type::multi_threaded);
        auto state=std::make_shared<RootDiscoverySession>();
        auto factory=make<RootDiscoveryFactory>(state).as<IClassFactory>();void* output=reinterpret_cast<void*>(1);
        assert(factory->CreateInstance(reinterpret_cast<::IUnknown*>(1),__uuidof(IObjectWithSite),&output)==CLASS_E_NOAGGREGATION&&!output);
        assert(factory->CreateInstance(nullptr,__uuidof(IObjectWithSite),nullptr)==E_POINTER);
        com_ptr<IObjectWithSite> site;assert(SUCCEEDED(factory->CreateInstance(nullptr,__uuidof(IObjectWithSite),site.put_void())));
        output=reinterpret_cast<void*>(1);assert(site->GetSite(__uuidof(IXamlDiagnostics),&output)==E_FAIL&&!output);
        state->stopping=true;output=reinterpret_cast<void*>(1);
        assert(factory->CreateInstance(nullptr,__uuidof(IObjectWithSite),&output)==E_ACCESSDENIED&&!output);
        rootDiscovery.store(state);CLSID unknown{};output=reinterpret_cast<void*>(1);
        assert(DllGetClassObject(unknown,__uuidof(IClassFactory),&output)==CLASS_E_CLASSNOTAVAILABLE&&!output);
        assert(DllGetClassObject(rootDiscoveryClsid,__uuidof(IClassFactory),&output)==CLASS_E_CLASSNOTAVAILABLE&&!output);
        rootDiscovery.store(nullptr);site=nullptr;factory=nullptr;state.reset();uninit_apartment();
        puts("PASS: exact class/UI-thread/active admission and COM factory denial boundaries");return 0;
    }
    if(strcmp(argv[1], "discovery-lifecycle") == 0) {
        winrt::init_apartment(winrt::apartment_type::multi_threaded);
        const DWORD baseline=Handles();
        for(unsigned failed=1;failed<=2;++failed){eventCalls=0;failEventAt=failed;assert(!StartRootDiscovery());assert(!rootDiscovery.load()&&Handles()==baseline);}
        failEventAt=0;failWorker=true;assert(!StartRootDiscovery());assert(!rootDiscovery.load()&&Handles()==baseline);failWorker=false;
        for(unsigned repeat=0;repeat<5;++repeat){assert(StartRootDiscovery());assert(!StartRootDiscovery());auto state=rootDiscovery.load();assert(state&&state->stop&&state->refresh&&state->worker);RefreshRootDiscovery();assert(StopRootDiscovery());assert(!rootDiscovery.load()&&Handles()==baseline);}
        assert(StartRootDiscovery());auto state=rootDiscovery.load();failWaitHandle=state->worker;
        assert(!StopRootDiscovery());assert(rootDiscovery.load()==state&&state->stopping&&state->stop&&state->refresh&&state->worker);
        assert(StopRootDiscovery());assert(!rootDiscovery.load()&&Handles()==baseline);
        uninit_apartment();puts("PASS: partial event/thread failure, exact handle restoration, reconfiguration, bounded-stop retention and subsequent retry");return 0;
    }
    if(strcmp(argv[1], "partial-init") == 0) {
        winrt::init_apartment(winrt::apartment_type::multi_threaded);
        const DWORD baseline = Handles();
        for(unsigned failed = 1; failed <= 5; ++failed) {
            hookCall = 0; failHook = failed;
            assert(!StartHooks());
            assert(!enabled && !stopDiscovery && !discovery);
            assert(Handles() == baseline);
        }
        hookCall = 0; failHook = 0;
        assert(StartHooks());
        Stop();
        assert(Handles() == baseline);
        winrt::uninit_apartment();
        puts("PASS: each partial hook-admission failure releases its stop event; subsequent initialization succeeds");
        return 0;
    }

    if(strcmp(argv[1], "state-ownership") == 0) {
        Color baseline{255,40,40,40}, red{255,80,10,10}, later{255,17,19,21};
        Color actual=baseline;OwnedNativeBrush entry;
        auto read=[&]{return actual;};auto write=[&](Color c){actual=c;};
        assert(UpdateNativeBrush(entry,red,true,read,write)&&Same(actual,red));
        assert(UpdateNativeBrush(entry,red,false,read,write)&&Same(actual,baseline));
        assert(UpdateNativeBrush(entry,red,true,read,write));
        actual=later;
        assert(UpdateNativeBrush(entry,red,false,read,write)&&Same(actual,later));
        assert(UpdateNativeBrush(entry,red,true,read,write)&&Same(actual,later));
        actual=baseline;entry={};unsigned failure=0;
        auto throwingWrite=[&](Color c){actual=c;if(failure++==0)throw 1;};
        assert(!UpdateNativeBrush(entry,red,true,read,throwingWrite));
        assert(entry.owned&&Same(entry.before,baseline));
        assert(UpdateNativeBrush(entry,red,false,read,throwingWrite)&&Same(actual,baseline));
        actual=baseline;entry={};assert(UpdateNativeBrush(entry,red,true,read,write));
        auto failedRestore=[&](Color){throw 1;};
        assert(!UpdateNativeBrush(entry,red,false,read,failedRestore)&&entry.owned);
        assert(UpdateNativeBrush(entry,red,false,read,write)&&Same(actual,baseline));
        actual=baseline;entry={};HRESULT setterError=S_OK;
        auto deniedWrite=[&](Color){throw hresult_access_denied();};
        assert(!UpdateNativeBrush(entry,red,true,read,deniedWrite,&setterError));
        assert(setterError==E_ACCESSDENIED&&!entry.owned&&!entry.changed&&Same(actual,baseline));
        assert(UpdateNativeBrush(entry,red,true,read,write)&&Same(actual,red));
        assert(UpdateNativeBrush(entry,red,false,read,write)&&Same(actual,baseline));
        puts("PASS: exact brush restoration, app-edit preservation, mutation-then-throw and failed-restore retry");
        return 0;
    }
    if(strcmp(argv[1], "resource-ownership") == 0) {
        winrt::init_apartment(winrt::apartment_type::multi_threaded);
        auto baseline=box_value(L"native"), applied=box_value(L"theme"), later=box_value(L"app");
        LocalResourceValue actual;
        ControlKey entry{L"ButtonForeground",nullptr,applied};
        auto read=[&]{return actual;};
        auto write=[&](auto const& value){actual={true,value};};
        auto remove=[&]{actual={};};
        assert(ApplyControlKey(entry,read,write)&&actual.exists&&Identity(actual.value,applied));
        assert(RestoreControlKey(entry,read,write,remove)&&!actual.exists);
        actual={true,baseline};entry={L"ButtonForeground",nullptr,applied};
        assert(ApplyControlKey(entry,read,write));
        assert(RestoreControlKey(entry,read,write,remove)&&Identity(actual.value,baseline));
        actual={true,nullptr};entry={L"ButtonForeground",nullptr,applied};
        assert(ApplyControlKey(entry,read,write)&&entry.local);
        assert(RestoreControlKey(entry,read,write,remove)&&actual.exists&&!actual.value);
        actual={true,baseline};entry={L"ButtonForeground",nullptr,applied};
        assert(ApplyControlKey(entry,read,write));actual={true,later};
        assert(RestoreControlKey(entry,read,write,remove)&&Identity(actual.value,later));
        entry={L"ButtonForeground",nullptr,applied};assert(ApplyControlKey(entry,read,write));actual={};
        assert(RestoreControlKey(entry,read,write,remove)&&!actual.exists);
        actual={true,baseline};entry={L"ButtonForeground",nullptr,applied};
        auto partial=[&](auto const& value){write(value);throw hresult_error(E_FAIL);};
        assert(!ApplyControlKey(entry,read,partial)&&entry.owned&&Identity(entry.before,baseline));
        assert(RestoreControlKey(entry,read,write,remove)&&Identity(actual.value,baseline));
        entry={L"ButtonForeground",nullptr,applied};assert(ApplyControlKey(entry,read,write));
        auto denied=[&](auto const&){throw hresult_access_denied();};
        assert(!RestoreControlKey(entry,read,denied,remove)&&entry.owned&&Identity(entry.before,baseline));
        assert(RestoreControlKey(entry,read,write,remove)&&Identity(actual.value,baseline));
        actual={};entry={L"ButtonForeground",nullptr,applied};assert(ApplyControlKey(entry,read,write));
        auto deniedRemove=[&]{throw hresult_access_denied();};
        assert(!RestoreControlKey(entry,read,write,deniedRemove)&&entry.owned);
        assert(RestoreControlKey(entry,read,write,remove)&&!actual.exists);
        puts("PASS: resource absence, local/null baselines, later app replacement/deletion, partial writes and cleanup retry");
        return 0;
    }
    if(strcmp(argv[1], "paint-chrome-admission") == 0) {
        auto matches=[](const wchar_t* key,const wchar_t* expected){assert(key&&wcscmp(key,expected)==0);};
        matches(PaintChromeKey(L"PaintUI.Ribbon",L"Microsoft.UI.Xaml.Controls.StackPanel",Kind::Background,{76,58,58,58}),L"SolidBackgroundFillColorBaseBrush");
        matches(PaintChromeKey(L"PaintUI.RibbonControl",L"PaintUI.Ribbon",Kind::Background,{76,58,58,58}),L"SolidBackgroundFillColorBaseBrush");
        matches(PaintChromeKey(L"Microsoft.UI.Xaml.Controls.Grid",L"PaintUI.RibbonControl",Kind::Background,{76,58,58,58}),L"SolidBackgroundFillColorBaseBrush");
        matches(PaintChromeKey(L"Microsoft.UI.Xaml.Controls.Grid",L"PaintUI.LayersPanel",Kind::Background,{76,58,58,58}),L"SolidBackgroundFillColorBaseBrush");
        matches(PaintChromeKey(L"PaintUI.RibbonControl",L"PaintUI.Ribbon",Kind::Border,{255,28,28,28}),L"DividerStrokeColorDefaultBrush");
        for(auto type:{L"PaintUI.RibbonGroup",L"PaintUI.RibbonCollapsibleGroup"})matches(PaintChromeKey(type,L"PaintUI.RibbonPanel",Kind::Border,{21,255,255,255}),L"DividerStrokeColorDefaultBrush");
        assert(!PaintChromeKey(L"PaintUI.D2DSwapChainPanel",L"PaintUI.Ribbon",Kind::Background,{76,58,58,58}));
        assert(!PaintChromeKey(L"PaintUI.ColorRadioButton",L"PaintUI.Ribbon",Kind::Background,{76,58,58,58}));
        assert(!PaintChromeKey(L"Microsoft.UI.Xaml.Controls.Grid",L"PaintUI.ItemHoverGridView",Kind::Background,{76,58,58,58}));
        assert(!PaintChromeKey(L"PaintUI.Ribbon",L"Microsoft.UI.Xaml.Controls.StackPanel",Kind::Foreground,{76,58,58,58}));
        assert(!PaintChromeKey(L"PaintUI.Ribbon",L"Microsoft.UI.Xaml.Controls.Grid",Kind::Background,{76,58,58,58}));
        assert(!PaintChromeKey(L"PaintUI.Ribbon",L"Microsoft.UI.Xaml.Controls.StackPanel",Kind::Background,{255,58,58,58}));
        puts("PASS: observed Paint chrome class, parent, property and neutral color required; swatches and drawing classes excluded");
        return 0;
    }

    if(strcmp(argv[1],"container-admission") == 0) {
        assert(RootCandidateClass(L"PaintUI.AppChrome"));
        assert(RootCandidateClass(L"Microsoft.UI.Xaml.Controls.Grid"));
        assert(RootCandidateClass(L"NotepadXamlUI.TabsBar"));
        assert(!RootCandidateClass(L"PaintUI.Canvas"));
        assert(!RootCandidateClass(L"PaintUI.D2DSwapChainPanel"));
        assert(!RootCandidateClass(L"PaintUI.ColorRadioButton"));
        assert(!RootCandidateClass(L"PaintUI.ItemHoverGridView"));
        assert(!RootCandidateClass(L"NotepadXamlUI.Document"));
        assert(!RootCandidateClass(L"Unrelated.Controls.Grid"));
        assert(!RootCandidateClass(L"PaintUI.AppChromeExtension"));
        puts("PASS: observed containers admitted; document, swatch, drawing and unrelated classes excluded");
        return 0;
    }

    if(strcmp(argv[1],"tab-neutral-admission") == 0) {
        const auto grid=L"Microsoft.UI.Xaml.Controls.Grid";
        assert(wcscmp(NotepadTabNeutralKey(true,grid,grid,{115,58,58,58},true),L"TabViewItemHeaderBackgroundSelected")==0);
        assert(wcscmp(NotepadTabNeutralKey(true,grid,grid,{115,58,58,58},false),L"SolidBackgroundFillColorBaseBrush")==0);
        assert(!NotepadTabNeutralKey(false,grid,grid,{115,58,58,58},false));
        assert(!NotepadTabNeutralKey(true,grid,L"Unrelated",{115,58,58,58},false));
        assert(!NotepadTabNeutralKey(true,grid,grid,{255,58,58,58},false));
        assert(!NotepadTabNeutralKey(true,L"Document",grid,{115,58,58,58},false));
        puts("PASS: selected tab and unused header fill remain distinct; unrelated root, class, parent and color refused");return 0;
    }

    if(strcmp(argv[1],"wrapper-admission") == 0) {
        assert(ChromeWrapperClass(L"Microsoft.UI.Xaml.Controls.Border"));
        assert(ChromeWrapperClass(L"Microsoft.UI.Xaml.Controls.ScrollContentPresenter"));
        assert(ChromeWrapperClass(L"Microsoft.UI.Xaml.Controls.ScrollViewer"));
        assert(!ChromeWrapperClass(L"Microsoft.UI.Xaml.Controls.Grid"));
        assert(!ChromeWrapperClass(L"PaintUI.Canvas"));
        assert(!ChromeWrapperClass(L"NotepadXamlUI.Document"));
        assert(!ChromeWrapperClass(L"Unrelated.ScrollViewer"));
        puts("PASS: only observed scrolling wrappers admitted; layout, drawing and document classes refused");return 0;
    }
    if(strcmp(argv[1],"notepad-chrome-admission") == 0) {
        auto type=L"Microsoft.UI.Xaml.Controls.Grid";auto root=L"NotepadXamlUI.MainMenuBar";
        assert(NotepadToolbarSurfaceKey(root,type,root,Kind::Background,{115,58,58,58}));
        assert(!NotepadToolbarSurfaceKey(L"PaintUI.Canvas",type,root,Kind::Background,{115,58,58,58}));
        assert(!NotepadToolbarSurfaceKey(root,type,L"NotepadXamlUI.Document",Kind::Background,{115,58,58,58}));
        assert(!NotepadToolbarSurfaceKey(root,type,root,Kind::Foreground,{115,58,58,58}));
        assert(!NotepadToolbarSurfaceKey(root,type,root,Kind::Background,{114,58,58,58}));
        assert(NativeFocusBrushKey(Kind::FocusPrimary,true));assert(NativeFocusBrushKey(Kind::FocusSecondary,true));
        assert(!NativeFocusBrushKey(Kind::FocusPrimary,false));assert(!NativeFocusBrushKey(Kind::Background,true));
        assert(RootCandidateClass(root));assert(RootCandidateClass(L"NotepadXamlUI.TabsBar"));
        assert(!RootCandidateClass(L"PaintUI.AppChrome"));assert(!RootCandidateClass(L"NotepadXamlUI.Document"));assert(!RootCandidateClass(type));
        puts("PASS: static toolbar class, parent, color and property admission; native focus colors and document/root exclusions");return 0;
    }
    Start(strcmp(argv[1], "exit-completed") == 0);
    if(strcmp(argv[1], "cleanup-retry") == 0) {
        auto retained=uiState;const HWND channel=retained->channel;
        retained->nativeBrushes.push_back({});
        retained->nativeBrushes.back().before={255,17,19,21};
        assert(!FinishChannelCleanup(*retained,false));
        assert(uiState==retained&&IsWindow(channel)&&channels.size()==1);
        assert(Same(retained->nativeBrushes.back().before,{255,17,19,21}));
        Schedule();assert(!retained->queued);
        retained->nativeBrushes.clear();
        Stop();assert(!IsWindow(channel));
        puts("PASS: failed cleanup retains the real UI channel and baseline; subsequent cleanup completes");
        return 0;
    }

    if(strcmp(argv[1], "exit-active") == 0) return 0;
    if(strcmp(argv[1], "exit-completed") == 0) {
        assert(WaitForSingleObject(discovery, 2000) == WAIT_OBJECT_0);
        return 0;
    }
    Stop();
    const DWORD baseline = Handles();
    for(unsigned i = 0; i < 5; ++i) {
        Start();
        if(strcmp(argv[1], "reconfigure") == 0) {
            setting = 0;
            Wh_ModSettingsChanged();
            assert(!enabled);
            setting = 1;
            Wh_ModSettingsChanged();
            assert(enabled);
        }
        Stop();
        assert(Handles() == baseline);
    }
    puts("PASS: active/completed worker exit; queued callback teardown; repeated unload/settings changes; exact handle restoration");
}
