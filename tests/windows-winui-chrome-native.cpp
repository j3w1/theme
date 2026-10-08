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
static bool testHighContrast=false;
static BOOL WINAPI TestSystemParametersInfo(UINT action,UINT param,PVOID value,UINT flags) {
 if(action==SPI_GETHIGHCONTRAST){static_cast<HIGHCONTRASTW*>(value)->dwFlags=testHighContrast?HCF_HIGHCONTRASTON:0;return TRUE;}
 return ::SystemParametersInfoW(action,param,value,flags);
}
#define SystemParametersInfoW TestSystemParametersInfo
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
#if !J3W1_TEST_PAINT
// The observed ContentIsland has no IWeakReferenceSource. Exercise the same
// production storage with a peer that explicitly refuses weak references.
struct NoWeakBackingPeer : implements<NoWeakBackingPeer,Windows::Foundation::IStringable,no_weak_ref> {
 bool* destroyed;
 explicit NoWeakBackingPeer(bool* value):destroyed(value){}
 ~NoWeakBackingPeer(){*destroyed=true;}
 hstring ToString(){return {};}
};
#endif
#include "windows-chrome-transition-assertions.h"
static void CheckPaintSplitEdges() {
 const Color top{24,255,255,255},bottom{18,255,255,255},theme{255,80,10,10},app{255,17,19,21};
 assert(PaintSplitEdgeAdmission(true,false,2,double(0.33f),1,top,bottom));
 assert(!PaintSplitEdgeAdmission(false,false,2,double(0.33f),1,top,bottom));
 assert(!PaintSplitEdgeAdmission(true,true,2,double(0.33f),1,top,bottom));
 for(auto count:{0u,1u,3u})assert(!PaintSplitEdgeAdmission(true,false,count,double(0.33f),1,top,bottom));
 for(auto offset:{0.33,0.0,1.0})assert(!PaintSplitEdgeAdmission(true,false,2,offset,1,top,bottom));
 assert(!PaintSplitEdgeAdmission(true,false,2,double(0.33f),0.999,top,bottom));
 assert(!PaintSplitEdgeAdmission(true,false,2,double(0.33f),1,bottom,top));
 assert(!PaintSplitEdgeAdmission(true,false,2,double(0.33f),1,theme,bottom));
 bool mapped=false;for(auto const& rule:rules)if(wcscmp(rule.key,L"ButtonBorderBrushPointerOver")==0)mapped=true;assert(mapped);
 std::array<Color,2> current{top,bottom};std::array<OwnedNativeBrush,2> values{};unsigned writes=0;
 auto read=[&](unsigned i){return current[i];};auto write=[&](unsigned i,Color c){++writes;current[i]=c;};
 assert(UpdatePaintSplitEdge(values,theme,true,read,write)&&writes==2&&Same(current[0],theme)&&Same(current[1],theme));
 assert(UpdatePaintSplitEdge(values,theme,true,read,write)&&writes==2);
 assert(UpdatePaintSplitEdge(values,{},false,read,write)&&writes==4&&Same(current[0],top)&&Same(current[1],bottom));
 assert(UpdatePaintSplitEdge(values,theme,true,read,write));current[0]=app;
 assert(UpdatePaintSplitEdge(values,theme,true,read,write)&&values[0].changed&&!values[0].owned&&Same(current[0],app));
 assert(UpdatePaintSplitEdge(values,{},false,read,write)&&Same(current[0],app)&&Same(current[1],bottom));
 current[0]=top;assert(UpdatePaintSplitEdge(values,theme,true,read,write)&&Same(current[0],top));
 assert(UpdatePaintSplitEdge(values,{},false,read,write));
 current={top,bottom};values={};writes=0;
 auto partial=[&](unsigned i,Color c){write(i,c);if(i==0)throw hresult_error(E_FAIL);};
 assert(!UpdatePaintSplitEdge(values,theme,true,read,partial)&&values[0].owned&&values[1].owned&&writes==2);
 auto denied=[&](unsigned i,Color c){if(i==0)throw hresult_access_denied();write(i,c);};
 assert(!UpdatePaintSplitEdge(values,{},false,read,denied)&&values[0].owned&&!values[1].owned&&Same(current[1],bottom));
 assert(UpdatePaintSplitEdge(values,{},false,read,write)&&Same(current[0],top)&&Same(current[1],bottom));
 current={top,bottom};values={};writes=0;
 auto unavailable=[&](unsigned i)->Color{if(i==0)throw hresult_error(E_FAIL);return current[i];};
 assert(!UpdatePaintSplitEdge(values,theme,true,unavailable,write)&&!values[0].owned&&values[1].owned&&writes==1);
 assert(UpdatePaintSplitEdge(values,{},false,read,write)&&Same(current[0],top)&&Same(current[1],bottom));
 puts("PASS: exact Paint split-edge shape and protected-data refusal; paired ownership, app-write preservation, partial failure and exact retry restoration");
}
int main(int argc, char** argv) {
 if(argc>1&&strcmp(argv[1],"paint-split-edge-ownership")==0){CheckPaintSplitEdges();return 0;}
 if(argc>1&&strcmp(argv[1],"background-transition-ownership")==0){CheckChromeTransitions();return 0;}
 if(argc>1&&strcmp(argv[1],"hover-state-palette")==0){CheckChromeHoverStates();return 0;}
 if(argc>1&&strcmp(argv[1],"split-parent-bindings")==0) {
  for(auto type:{L"Microsoft.UI.Xaml.Controls.SplitButton",L"Windows.UI.Xaml.Controls.SplitButton"}) {
   for(auto kind:{Kind::Background,Kind::Foreground,Kind::Border}) {
    auto key=SplitButtonTemplateBindingKey(type,kind);assert(key);
    bool mapped=false;for(auto const& rule:rules)if(wcscmp(rule.key,key)==0)mapped=true;assert(mapped);
   }
   assert(wcscmp(SplitButtonTemplateBindingKey(type,Kind::Background),L"SplitButtonBackground")==0);
   assert(wcscmp(SplitButtonTemplateBindingKey(type,Kind::Foreground),L"SplitButtonForeground")==0);
   assert(wcscmp(SplitButtonTemplateBindingKey(type,Kind::Border),L"SplitButtonBorderBrush")==0);
   for(auto kind:{Kind::FocusPrimary,Kind::FocusSecondary,Kind::Separator,Kind::ToggleOnFill,Kind::ToggleOnStroke})assert(!SplitButtonTemplateBindingKey(type,kind));
  }
  for(auto type:{L"Microsoft.UI.Xaml.Controls.SplitButtonExtra",L"Microsoft.UI.Xaml.Controls.Button",L"PaintUI.ColorRadioButton",L"PaintUI.D2DSwapChainPanel",L"NotepadXamlUI.Document",L""})
   for(auto kind:{Kind::Background,Kind::Foreground,Kind::Border})assert(!SplitButtonTemplateBindingKey(type,kind));
  puts("PASS: exact SplitButton parent binding keys; existing palette, focus/data/custom-control exclusions preserved");return 0;
 }
 assert(NativeScrollbarChrome(L"Microsoft.UI.Xaml.Controls.Primitives.ScrollBar"));
 assert(NativeScrollbarChrome(L"Windows.UI.Xaml.Controls.Primitives.ScrollBar"));
 for(auto type:{L"PaintUI.Canvas",L"PaintUI.D2DSwapChainPanel",L"Microsoft.UI.Xaml.Controls.ScrollViewer",L"Microsoft.UI.Xaml.Controls.Slider",L"NotepadXamlUI.ScrollBar",L"Microsoft.UI.Xaml.Controls.Primitives.ScrollBarExtra"})assert(!NativeScrollbarChrome(type));
 if(argc>1&&strcmp(argv[1],"window-backing-ownership")==0) {
#if !J3W1_TEST_PAINT
  {
   bool destroyed=false;
   WindowBacking retained;
   auto peer=make<NoWeakBackingPeer>(&destroyed).as<ProjectedObject>();
   assert(!peer.try_as<impl::IWeakReferenceSource>());
   retained.island=peer;
   peer=nullptr;
   assert(!destroyed&&retained.island);
   retained.island=nullptr;
   assert(destroyed);
  }
  assert(TabIslandAdmission(L"NotepadXamlUI.TabsBar",true,true,true,true,true));
  for(auto type:{L"NotepadXamlUI.MainMenuBar",L"NotepadXamlUI.StatusBar",L"PaintUI.Canvas",L"Microsoft.UI.Xaml.Controls.Grid"})
   assert(!TabIslandAdmission(type,true,true,true,true,true));
  for(unsigned flag=0;flag<5;++flag)assert(!TabIslandAdmission(L"NotepadXamlUI.TabsBar",flag!=0,flag!=1,flag!=2,flag!=3,flag!=4));
  assert(CompositionTargetState(true,true)==0&&CompositionTargetState(true,false)==0);
  assert(CompositionTargetState(false,true)==1&&CompositionTargetState(false,false)==2);
#endif
  init_apartment(apartment_type::multi_threaded);
  {
  auto theme=box_value(1),native=box_value(2),app=box_value(3);ProjectedObject current{nullptr};
  auto read=[&]{return current;};auto write=[&](auto const& value){current=value;};
  OwnedCompositionBrush entry{nullptr,theme};
  assert(UpdateCompositionBrush(entry,true,read,write)&&entry.owned&&Identity(current,theme));
  assert(UpdateCompositionBrush(entry,false,read,write)&&!current&&!entry.owned);
  current=native;entry={nullptr,theme};
  assert(UpdateCompositionBrush(entry,true,read,write));current=app;
  assert(UpdateCompositionBrush(entry,false,read,write)&&entry.changed&&Identity(current,app));
  assert(UpdateCompositionBrush(entry,true,read,write)&&Identity(current,app));
  current=native;entry={nullptr,theme};auto partial=[&](auto const& value){current=value;throw hresult_error(E_FAIL);};
  assert(!UpdateCompositionBrush(entry,true,read,partial)&&entry.owned&&Identity(current,theme));
  assert(UpdateCompositionBrush(entry,false,read,write)&&Identity(current,native));
  entry={nullptr,theme};assert(UpdateCompositionBrush(entry,true,read,write));
  auto fail=[](auto const&){throw hresult_error(E_FAIL);};
  assert(!UpdateCompositionBrush(entry,false,read,fail)&&entry.owned);
  assert(UpdateCompositionBrush(entry,false,read,write)&&Identity(current,native));
  }
#if J3W1_TEST_PAINT
  assert(PopupBackingAdmission(L"Microsoft.UI.Xaml.Controls.MenuFlyoutPresenter",true,true,true,true));
  for(auto type:{L"Microsoft.UI.Xaml.Controls.FlyoutPresenter",L"Microsoft.UI.Xaml.Controls.Grid",L"PaintUI.D2DSwapChainPanel"})
   assert(!PopupBackingAdmission(type,true,true,true,true));
  assert(!PopupBackingAdmission(L"Microsoft.UI.Xaml.Controls.MenuFlyoutPresenter",false,true,true,true));
  assert(!PopupBackingAdmission(L"Microsoft.UI.Xaml.Controls.MenuFlyoutPresenter",true,false,true,true));
  assert(!PopupBackingAdmission(L"Microsoft.UI.Xaml.Controls.MenuFlyoutPresenter",true,true,false,true));
  assert(!PopupBackingAdmission(L"Microsoft.UI.Xaml.Controls.MenuFlyoutPresenter",true,true,true,false));
  {
   auto native=box_value(2),app=box_value(3);ProjectedObject current=native;
   auto read=[&]{return current;};auto write=[&](auto const& value){current=value;};
   OwnedCompositionBrush entry{native,nullptr};
   assert(UpdateCompositionBrush(entry,true,read,write)&&entry.owned&&!current);
   assert(UpdateCompositionBrush(entry,true,read,write)&&entry.owned&&!current);
   assert(UpdateCompositionBrush(entry,false,read,write)&&Identity(current,native));
   entry={native,nullptr};assert(UpdateCompositionBrush(entry,true,read,write));current=app;
   assert(UpdateCompositionBrush(entry,false,read,write)&&entry.changed&&Identity(current,app));
   assert(UpdateCompositionBrush(entry,true,read,write)&&Identity(current,app));
   current=native;entry={native,nullptr};auto partial=[&](auto const& value){current=value;throw hresult_error(E_FAIL);};
   assert(!UpdateCompositionBrush(entry,true,read,partial)&&entry.owned&&!current);
   auto fail=[](auto const&){throw hresult_error(E_FAIL);};
   assert(!UpdateCompositionBrush(entry,false,read,fail)&&entry.owned);
   assert(UpdateCompositionBrush(entry,false,read,write)&&Identity(current,native));
  }
#endif
  uninit_apartment();puts("PASS: nullable composition baseline, exact object restore, later app changes, partial writes and retry");return 0;
 }
    assert(argc == 2);
 if(strcmp(argv[1],"cached-color-frame")==0) {
  assert(ChromeColorFrameAdmission(L"ContentPresenter",L"Background",1,true,0));
  assert(ChromeColorFrameAdmission(L"RootGrid",L"BorderBrush",1,true,0));
  assert(ChromeColorFrameAdmission(L"ChevronIcon",L"Foreground",1,true,0));
  for(auto property:{L"Text",L"Content",L"Opacity",L"Width",L"RenderTransform"})assert(!ChromeColorFrameAdmission(L"ContentPresenter",property,1,true,0));
  assert(!ChromeColorFrameAdmission(L"Artwork",L"Background",1,true,0));
  assert(!ChromeColorFrameAdmission(L"ContentPresenter",L"Background",2,true,0));
  assert(!ChromeColorFrameAdmission(L"ContentPresenter",L"Background",1,false,0));
  assert(!ChromeColorFrameAdmission(L"ContentPresenter",L"Background",1,true,1));
  assert(!ChromeColorState(L"Selected")&&!ChromeColorState(L"Other"));
  assert(ChromeSetterState(L"Selected")&&ChromeSetterState(L"CheckedPointerOver"));
  assert(ChromeSetterAdmission(L"Background",true,false));
  assert(!ChromeSetterAdmission(L"Background",true,true));
  assert(!ChromeSetterAdmission(L"Content",true,false));
  assert(!ChromeSetterAdmission(L"Background",false,false));
  winrt::init_apartment(winrt::apartment_type::multi_threaded);
  // Keep one apartment alive for this entire case: cached WinRT factories
  // cannot be reused after tearing down and reinitializing their apartment.
  // An unreadable state must leave the already owned root and baseline intact.
  {
   auto original=box_value(1),applied=box_value(2);
   OwnedChromeFrame rootOwner{original,applied,true};ProjectedObject rootValue=applied;
   unsigned transitions=0,writes=0;
   if(InspectChromeState([]()->bool{throw hresult_error(E_FAIL);})){++transitions;++writes;rootValue=original;}
   assert(transitions==0&&writes==0&&rootOwner.owned&&Identity(rootValue,applied)&&Identity(rootOwner.original,original));
   assert(!InspectChromeState([]()->bool{throw hresult_error(E_ACCESSDENIED);}));
   assert(!InspectChromeState([]{return false;}));
   assert(InspectChromeState([]{return true;}));
  }
  auto native=box_value(1),theme=box_value(2),app=box_value(3);ChromeFrameValue current{true,native};
  auto read=[&]{return current;};auto write=[&](auto const& value){current={true,value};};
  auto clock=ClockState::Stopped;auto getClock=[&]{return clock;};OwnedChromeFrame entry{native,theme};
  clock=ClockState::Active;assert(!UpdateChromeFrame(entry,true,read,write,getClock)&&!entry.owned&&Identity(current.value,native));
  clock=ClockState::Filling;assert(!UpdateChromeFrame(entry,true,read,write,getClock)&&!entry.owned);
  clock=ClockState::Stopped;assert(UpdateChromeFrame(entry,true,read,write,getClock)&&entry.owned&&Identity(current.value,theme));
  assert(UpdateChromeFrame(entry,false,read,write,getClock)&&!entry.owned&&Identity(current.value,native));
  auto partial=[&](auto const& value){write(value);throw hresult_error(E_FAIL);};
  assert(!UpdateChromeFrame(entry,true,read,partial,getClock)&&entry.owned&&Identity(current.value,theme));
  assert(!UpdateChromeFrame(entry,false,read,partial,getClock)&&entry.owned&&Identity(current.value,native));
  assert(UpdateChromeFrame(entry,false,read,write,getClock)&&!entry.owned);
  entry={native,theme};assert(UpdateChromeFrame(entry,true,read,write,getClock));current={true,app};
  assert(UpdateChromeFrame(entry,false,read,write,getClock)&&Identity(current.value,app));
  current={false,nullptr};entry={native,theme};assert(!UpdateChromeFrame(entry,true,read,write,getClock)&&!entry.owned);

  assert(ChromeTransparentBaseStateAdmission(1,true,false,false));
  assert(!ChromeTransparentBaseStateAdmission(1,false,false,false));
  for(unsigned state:{2u,3u}) {
   assert(ChromeTransparentBaseStateAdmission(state,false,true,true));
   assert(!ChromeTransparentBaseStateAdmission(state,false,true,false));
   assert(!ChromeTransparentBaseStateAdmission(state,false,false,true));
  }
  // The recorded Paint Disabled template only animates foreground/border.
  assert(ChromeTransparentBaseStateAdmission(4,false,true,false));
  assert(!ChromeTransparentBaseStateAdmission(4,false,false,false));
  assert(!ChromeTransparentBaseStateAdmission(5,false,true,true));
  assert(ChromeTransparentBaseAdmission({0,255,255,255},true,true));
  for(auto color:{Color{1,255,255,255},Color{0,255,254,255},Color{0,0,0,0},Color{255,255,255,255}})assert(!ChromeTransparentBaseAdmission(color,true,true));
  assert(!ChromeTransparentBaseAdmission({0,255,255,255},false,true));
  assert(!ChromeTransparentBaseAdmission({0,255,255,255},true,false));
  // Restoring a style-sourced baseline writes its exact UnsetValue receipt;
  // the platform writer clears that property instead of fixing a local brush.
  current={true,native};OwnedChromeBase base{{native,theme}};
  assert(UpdateChromeBase(base,true,read,write)&&base.value.owned&&Identity(current.value,theme));
  assert(UpdateChromeBase(base,false,read,write)&&!base.value.owned&&Identity(current.value,native));
  base={{native,theme}};assert(!UpdateChromeBase(base,true,read,partial)&&base.value.owned);
  assert(!UpdateChromeBase(base,false,read,partial)&&base.value.owned&&Identity(current.value,native));
  assert(UpdateChromeBase(base,false,read,write)&&!base.value.owned);
  current={true,native};base={{native,theme}};assert(UpdateChromeBase(base,true,read,write));current={true,app};
  assert(UpdateChromeBase(base,true,read,write)&&base.replaced&&!base.value.owned&&Identity(current.value,app));
  assert(UpdateChromeBase(base,false,read,write)&&Identity(current.value,app));
  current={false,nullptr};base={{native,theme}};
  assert(!UpdateChromeBase(base,true,read,write)&&!base.value.owned);

  puts("PASS: cached color-only frames and transparent-base admission, exact restore, partial writes and application replacement");return 0;
 }
 if(strcmp(argv[1],"composite-button-scope")==0) {
  assert(CompositeButtonChrome(L"Microsoft.UI.Xaml.Controls.SplitButton"));
  for(auto type:{L"PaintUI.ColorRadioButton",L"PaintUI.Canvas",L"Microsoft.UI.Xaml.Controls.ColorPicker",L"NotepadXamlUI.TabsBar",L"Other.SplitButton",L"Microsoft.UI.Xaml.Controls.SplitButtonExtra"})assert(!CompositeButtonChrome(type));
  puts("PASS: split-button owner admitted; application data controls and lookalikes excluded");return 0;
 }

    if(strcmp(argv[1], "closed-source-backdrop") == 0) {
        struct Source {
            bool attached=false;
            explicit operator bool() const{return true;}
            bool SiteBridge() const{return attached;}
        } source;
        unsigned reads=0,writes=0;bool owned=false;int current=7,baseline=0;
        auto apply=[&](auto const&){++reads;baseline=current;owned=true;current=0;++writes;};
        auto restore=[&](auto const&){++reads;if(owned&&current==0){current=baseline;++writes;}owned=false;};
        // A closed-but-retained host must never enter the unsafe getter/setter.
        assert(!WithAttachedSource(source,apply));assert(reads==0&&writes==0);
        source.attached=true;assert(WithAttachedSource(source,apply));assert(current==0&&owned);
        assert(WithAttachedSource(source,restore));assert(current==7&&!owned);
        assert(WithAttachedSource(source,apply));current=9;
        assert(WithAttachedSource(source,restore));assert(current==9&&!owned);
        assert(WithAttachedSource(source,apply));source.attached=false;
        const unsigned beforeReads=reads,beforeWrites=writes;
        assert(!WithAttachedSource(source,restore));assert(reads==beforeReads&&writes==beforeWrites);
        puts("PASS: attached baseline restore, later app color preservation, and no backdrop access after host close");return 0;
    }
    if(strcmp(argv[1], "retired-control-capacity") == 0) {
        init_apartment(apartment_type::multi_threaded);
        Root root;
        for(unsigned cycle=0;cycle<4;cycle++) {
            // Default weak references represent controls whose final strong
            // reference has already expired. Exercise the real refresh path.
            root.controls.resize(1024);
            Bridge(root);
            assert(root.controls.empty());
        }
        uninit_apartment();puts("PASS: expired popup receipts release the bounded control capacity");return 0;
    }
    if(strcmp(argv[1], "retired-control-retry") == 0) {
        init_apartment(apartment_type::multi_threaded);
        {
        auto baseline=box_value(L"native"),applied=box_value(L"theme"),later=box_value(L"app");
        Root root;root.controls.resize(2);
        auto& first=root.controls.front();first.keys.push_back({L"ButtonForeground",nullptr,applied});
        LocalResourceValue actual{true,baseline};
        auto read=[&]{return actual;};auto write=[&](auto const& value){actual={true,value};};auto remove=[&]{actual={};};
        assert(ApplyControlKey(first.keys.front(),read,write));
        first.refresh.pending=true;
        auto receipt=&first;
        assert(!PruneRetiredControls(root,[](ControlResources&){return false;}));
        assert(root.controls.size()==2 && &root.controls.front()==receipt);
        assert(first.refresh.pending&&first.keys.front().owned&&Identity(first.keys.front().before,baseline));
        // The app may keep and change a retired control's dictionary. Cleanup
        // preserves that replacement instead of writing the captured baseline.
        actual={true,later};unsigned restored=0;
        assert(PruneRetiredControls(root,[&](ControlResources& entry){
            ++restored;if(!entry.keys.empty())assert(RestoreControlKey(entry.keys.front(),read,write,remove));
            entry.refresh.pending=false;return true;
        }));
        assert(restored==2&&root.controls.empty()&&Identity(actual.value,later));
        } // Release boxed WinRT objects while their apartment is alive.
        uninit_apartment();puts("PASS: failed retirement retains ownership and later retry preserves application resource changes");return 0;
    }

    if(strcmp(argv[1],"public-caption-scope")==0) {
        assert(CaptionCompositionAdmitted(false)==J3W1_TEST_PAINT);
        assert(!CaptionCompositionAdmitted(true));
#if !J3W1_TEST_PAINT
        // No WinRT apartment or real app is needed: the production entry must
        // refuse before touching the public windowing API in either state.
        for(bool active:{false,true}){enabled=active;ThreadState state{};ApplyPublicCaptions(state);assert(state.publicCaptions.empty());}
#endif
        for(unsigned slot=0;slot<12;slot++) {
            assert(CaptionSlotAdmitted(slot)==J3W1_TEST_PAINT);
            if(!J3W1_TEST_PAINT) {
                // Every public caption read/write is unadmitted for Notepad.
                unsigned rejected=0;
                try{ReadCaption(nullptr,slot);}catch(hresult_invalid_argument const&){++rejected;}
                try{WriteCaption(nullptr,slot,nullptr);}catch(hresult_invalid_argument const&){++rejected;}
                try{CaptionRoleColor(slot);}catch(hresult_invalid_argument const&){++rejected;}
                assert(rejected==3);
            }
        }
        assert(!CaptionSlotAdmitted(12));
        puts("PASS: Notepad refuses every public caption access before COM; Paint retains native-title admission");return 0;
    }
    if(strcmp(argv[1],"public-caption-ownership")==0) {
        init_apartment(apartment_type::multi_threaded);
        auto baseline=box_value(Color{255,21,23,25}).as<CaptionColor>();
        auto applied=box_value(CanvasColor()).as<CaptionColor>();
        auto later=box_value(Color{255,31,33,35}).as<CaptionColor>();
        CaptionColor actual{nullptr};CaptionSlot slot;
        auto read=[&]{return actual;};auto write=[&](CaptionColor const& c){actual=c;};
        assert(UpdateCaptionSlot(slot,applied,true,read,write)&&SameCaptionColor(actual,applied));
        assert(!slot.before&&slot.owned);
        assert(UpdateCaptionSlot(slot,nullptr,false,read,write)&&!actual&&!slot.owned);
        actual=baseline;slot={};assert(UpdateCaptionSlot(slot,applied,true,read,write));
        assert(UpdateCaptionSlot(slot,nullptr,false,read,write)&&SameCaptionColor(actual,baseline));
        assert(UpdateCaptionSlot(slot,applied,true,read,write));actual=later;
        assert(UpdateCaptionSlot(slot,nullptr,false,read,write)&&SameCaptionColor(actual,later)&&slot.changed);
        assert(UpdateCaptionSlot(slot,applied,true,read,write)&&SameCaptionColor(actual,later));
        actual=nullptr;slot={};unsigned attempts=0;
        auto partial=[&](CaptionColor const& c){actual=c;if(attempts++==0)throw 1;};
        assert(!UpdateCaptionSlot(slot,applied,true,read,partial)&&slot.owned&&!slot.before);
        assert(UpdateCaptionSlot(slot,nullptr,false,read,partial)&&!actual);
        actual=baseline;slot={};auto denied=[&](CaptionColor const&){throw 1;};
        assert(!UpdateCaptionSlot(slot,applied,true,read,denied)&&!slot.owned&&!slot.changed);
        assert(UpdateCaptionSlot(slot,applied,true,read,write));
        assert(!UpdateCaptionSlot(slot,nullptr,false,read,denied)&&slot.owned&&SameCaptionColor(slot.before,baseline));
        assert(UpdateCaptionSlot(slot,nullptr,false,read,write)&&SameCaptionColor(actual,baseline));
        actual=nullptr;slot={};assert(UpdateCaptionSlot(slot,applied,true,read,write));
        auto failedRead=[&]() -> CaptionColor {throw 1;};
        assert(!UpdateCaptionSlot(slot,nullptr,false,failedRead,write)&&slot.owned);
        assert(UpdateCaptionSlot(slot,nullptr,false,read,write)&&!actual);
        publicCaptionWrite=false;{CaptionWriteGuard outer;assert(publicCaptionWrite);{CaptionWriteGuard inner;assert(publicCaptionWrite);}assert(publicCaptionWrite);}assert(!publicCaptionWrite);
        uninit_apartment();puts("PASS: nullable/explicit baselines, later application edits, partial write, denied setter, read failure and cleanup retry");return 0;
    }
    if(strcmp(argv[1],"public-caption-window-ownership")==0) {
        WNDCLASSW type{};type.lpfnWndProc=DefWindowProcW;type.hInstance=GetModuleHandleW(nullptr);type.lpszClassName=J3W1_TEST_PAINT?L"MSPaintApp":L"Notepad";
        assert(RegisterClassW(&type));
        HWND window=CreateWindowExW(0,type.lpszClassName,L"",WS_POPUP,0,0,1,1,nullptr,nullptr,type.hInstance,nullptr);
        assert(window&&PublicCaptionWindow(window));
        PublicCaption caption;caption.window=window;
        assert(!OwnsPublicCaptionWindow(caption));assert(SetPropW(window,publicCaptionProperty,&caption));assert(OwnsPublicCaptionWindow(caption));
        PublicCaption other;other.window=window;assert(!OwnsPublicCaptionWindow(other));
        assert(RemovePropW(window,publicCaptionProperty)==&caption);assert(SetPropW(window,publicCaptionProperty,&other));
        assert(RestorePublicCaption(caption)&&GetPropW(window,publicCaptionProperty)==&other);
        assert(RemovePropW(window,publicCaptionProperty)==&other);assert(SetPropW(window,publicCaptionProperty,&caption));
        assert(DestroyWindow(window)&&!OwnsPublicCaptionWindow(caption));
        window=CreateWindowExW(0,type.lpszClassName,L"",WS_POPUP,0,0,1,1,nullptr,nullptr,type.hInstance,nullptr);
        assert(window);caption.window=window;assert(!OwnsPublicCaptionWindow(caption));assert(RestorePublicCaption(caption));
        assert(DestroyWindow(window)&&UnregisterClassW(type.lpszClassName,type.hInstance));
        assert(!PublicCaptionWindow(nullptr));
        puts("PASS: stable window-property ownership, later replacement, destroyed windows and handle reuse admission");return 0;
    }

    if(strcmp(argv[1],"keytip-ownership") == 0) {
        for(auto key:{L"KeyTipBackground",L"KeyTipBorderBrush",L"KeyTipForeground"})assert(KeyTipResource(key));
        for(auto key:{L"KeyTipFontFamily",L"KeyTipThemePadding",L"Background",L"KeyTipForegroundExtra",L"DocumentForeground"})assert(!KeyTipResource(key));
        assert(!ClaimKeyTipOwner(0));assert(ClaimKeyTipOwner(11));assert(ClaimKeyTipOwner(11));assert(!ClaimKeyTipOwner(12));
        ReleaseKeyTipOwner(12);assert(keyTipOwnerThread==11);ReleaseKeyTipOwner(11);assert(keyTipOwnerThread==0);
        assert(ClaimKeyTipOwner(12));ReleaseKeyTipOwner(12);
        puts("PASS: only documented keytip color resources admitted; one UI-thread owner and exact release");return 0;
    }
    if(strcmp(argv[1],"backing-admission") == 0) {
        assert(PaintBackingAdmission(L"PaintUI.AppChrome",L"Microsoft.UI.Xaml.Controls.Grid",1,true));
        assert(!PaintBackingAdmission(L"PaintUI.Canvas",L"Microsoft.UI.Xaml.Controls.Grid",1,true));
        assert(!PaintBackingAdmission(L"Microsoft.UI.Xaml.Controls.UserControl",L"Microsoft.UI.Xaml.Controls.Grid",1,true));
        assert(!PaintBackingAdmission(L"PaintUI.AppChrome",L"PaintUI.D2DSwapChainPanel",1,true));
        assert(!PaintBackingAdmission(L"PaintUI.AppChrome",L"Microsoft.UI.Xaml.Controls.Grid",2,true));
        assert(!PaintBackingAdmission(L"PaintUI.AppChrome",L"Microsoft.UI.Xaml.Controls.Grid",1,false));
        puts("PASS: exact opaque Paint backing and document/cross-root rejection");return 0;
    }

    if(strcmp(argv[1],"captured-native-backdrop") == 0) {
        NativeBackdrop slot;DWORD actual=DWMSBT_TABBEDWINDOW;unsigned reads=0,writes=0;
        auto read=[&](DWORD& out){++reads;out=actual;return S_OK;};
        auto write=[&](DWORD value){++writes;actual=value;return S_OK;};
        assert(UpdateNativeBackdrop(slot,true,read,write)&&slot.owned&&slot.before==DWMSBT_TABBEDWINDOW&&actual==DWMSBT_NONE);
        assert(UpdateNativeBackdrop(slot,true,read,write)&&writes==1);
        assert(UpdateNativeBackdrop(slot,false,read,write)&&!slot.owned&&actual==DWMSBT_TABBEDWINDOW);
        assert(UpdateNativeBackdrop(slot,true,read,write));actual=DWMSBT_MAINWINDOW;
        assert(UpdateNativeBackdrop(slot,false,read,write)&&slot.changed&&!slot.owned&&actual==DWMSBT_MAINWINDOW);
        auto beforeReads=reads,beforeWrites=writes;
        assert(UpdateNativeBackdrop(slot,true,read,write)&&reads==beforeReads&&writes==beforeWrites);
        slot={};assert(UpdateNativeBackdrop(slot,false,read,write)&&reads==beforeReads&&writes==beforeWrites);
        actual=99;assert(!UpdateNativeBackdrop(slot,true,read,write)&&!slot.owned&&actual==99);
        actual=DWMSBT_MAINWINDOW;auto deniedRead=[](DWORD&){return E_FAIL;};
        assert(!UpdateNativeBackdrop(slot,true,deniedRead,write)&&!slot.owned);
        auto deniedWrite=[](DWORD){return E_FAIL;};
        assert(!UpdateNativeBackdrop(slot,true,read,deniedWrite)&&!slot.owned&&actual==DWMSBT_MAINWINDOW);
        assert(UpdateNativeBackdrop(slot,true,read,write)&&slot.owned);
        assert(!UpdateNativeBackdrop(slot,false,read,deniedWrite)&&slot.owned&&actual==DWMSBT_NONE);
        assert(UpdateNativeBackdrop(slot,false,read,write)&&!slot.owned&&actual==DWMSBT_MAINWINDOW);
        puts("PASS: exact native backdrop baseline, high-contrast restoration, later edits, unknown values, failures and cleanup retry");return 0;
    }

#if !J3W1_TEST_PAINT
    if(strcmp(argv[1],"existing-caption-default-reset") == 0) {
        WNDCLASSW type{};type.lpfnWndProc=DefWindowProcW;type.hInstance=GetModuleHandleW(nullptr);
        type.lpszClassName=L"Notepad";assert(RegisterClassW(&type));
        auto create=[&](DWORD style=WS_POPUP,HWND parent=nullptr){return CreateWindowExW(0,type.lpszClassName,L"",style,0,0,20,20,parent,nullptr,type.hInstance,nullptr);};
        HWND window=create();assert(window);
        static DWORD caption=RGB(1,2,3),backdrop=DWMSBT_TABBEDWINDOW;
        static bool failCaption=false,failRead=false,failBackdrop=false;static unsigned writes=0;
        nativeDwmGet=+[](HWND,DWORD attribute,PVOID value,DWORD size)->HRESULT {
            assert(attribute==DWMWA_SYSTEMBACKDROP_TYPE&&size==sizeof(DWORD));
            if(failRead)return E_FAIL;memcpy(value,&backdrop,size);return S_OK;
        };
        originalDwmSet=+[](HWND,DWORD attribute,LPCVOID value,DWORD size)->HRESULT {
            assert(size==sizeof(DWORD));++writes;
            if(attribute==DWMWA_CAPTION_COLOR){if(failCaption)return E_FAIL;memcpy(&caption,value,size);}
            else {assert(attribute==DWMWA_SYSTEMBACKDROP_TYPE);if(failBackdrop)return E_FAIL;memcpy(&backdrop,value,size);}return S_OK;
        };
        enabled=true;
        DiscoverExistingCaptions(false,true);DiscoverExistingCaptions(true,false);
        assert(writes==0&&!OwnedCaption(window));
        enabled=false;DiscoverExistingCaptions(true,true);assert(!CaptureExistingCaption(window)&&writes==0);
        enabled=true;testHighContrast=true;DiscoverExistingCaptions(true,true);assert(!CaptureExistingCaption(window)&&writes==0);
        testHighContrast=false;
        assert(!CaptureExistingCaption(GetDesktopWindow()));
        HWND wrong=CreateWindowExW(0,L"STATIC",L"",WS_POPUP,0,0,20,20,nullptr,nullptr,type.hInstance,nullptr);assert(wrong);
        HWND child=create(WS_CHILD,window);assert(child);
        assert(!CaptureExistingCaption(wrong)&&!CaptureExistingCaption(child)&&writes==0);
        auto cookie=reinterpret_cast<HANDLE>(ULONG_PTR(1));assert(SetPropW(window,captionProperty,cookie));
        assert(!CaptureExistingCaption(window)&&GetPropW(window,captionProperty)==cookie&&writes==0);RemovePropW(window,captionProperty);
        failCaption=true;assert(!CaptureExistingCaption(window)&&!OwnedCaption(window)&&captions.empty());
        failCaption=false;DiscoverExistingCaptions(true,true);
        auto state=OwnedCaption(window);assert(state&&state->resetToDefault&&state->before==DWMWA_COLOR_DEFAULT&&state->applied);
        assert(caption==RGB(0,0,0)&&backdrop==DWMSBT_NONE&&state->backdrop.before==DWMSBT_TABBEDWINDOW);
        assert(!OwnedCaption(wrong)&&!OwnedCaption(child));
        auto count=captions.size();assert(CaptureExistingCaption(window)&&captions.size()==count);
        testHighContrast=true;RefreshCaptions();assert(caption==DWMWA_COLOR_DEFAULT&&backdrop==DWMSBT_TABBEDWINDOW&&!state->applied);
        testHighContrast=false;RefreshCaptions();assert(caption==RGB(0,0,0)&&backdrop==DWMSBT_NONE);
        failCaption=true;assert(!ForgetCaption(state,true)&&OwnedCaption(window)==state&&state->applied);
        failCaption=false;failBackdrop=true;assert(!ForgetCaption(state,true)&&OwnedCaption(window)==state&&!state->applied&&state->backdrop.owned);
        failBackdrop=false;assert(ForgetCaption(state,true)&&caption==DWMWA_COLOR_DEFAULT&&backdrop==DWMSBT_TABBEDWINDOW&&!OwnedCaption(window));
        assert(CaptureExistingCaption(window));state=OwnedCaption(window);
        COLORREF genuine=RGB(31,33,35);failCaption=true;assert(FAILED(DwmCaptionHook(window,DWMWA_CAPTION_COLOR,&genuine,sizeof(genuine)))&&state->resetToDefault&&state->before==DWMWA_COLOR_DEFAULT);failCaption=false;assert(SUCCEEDED(DwmCaptionHook(window,DWMWA_CAPTION_COLOR,&genuine,sizeof(genuine))));
        assert(state->before==genuine&&!state->resetToDefault);
        assert(CaptureExistingCaption(window)&&state->before==genuine&&!state->resetToDefault);
        enabled=false;RefreshCaptions();assert(caption==genuine&&backdrop==DWMSBT_TABBEDWINDOW);
        enabled=true;RefreshCaptions();assert(ForgetCaption(state,true)&&caption==genuine);
        // A genuine receipt captured before discovery must also remain exact.
        state=CaptureCaption(window,genuine);assert(state&&!state->resetToDefault);
        assert(CaptureExistingCaption(window)&&state->before==genuine&&!state->resetToDefault);RefreshCaptions();
        backdrop=DWMSBT_MAINWINDOW;assert(ForgetCaption(state,true)&&caption==genuine&&backdrop==DWMSBT_MAINWINDOW);
        failRead=true;assert(CaptureExistingCaption(window));state=OwnedCaption(window);assert(!state->backdrop.owned);
        failRead=false;RefreshCaptions();assert(state->backdrop.owned);assert(ForgetCaption(state,true));
        assert(CaptureExistingCaption(window));state=OwnedCaption(window);
        assert(DestroyWindow(window));RefreshCaptions();assert(captions.empty());
        window=create();assert(window&&!OwnedCaption(window)&&!GetPropW(window,captionProperty));
        assert(CaptureExistingCaption(window));state=OwnedCaption(window);
        RemovePropW(window,captionProperty);assert(SetPropW(window,captionProperty,cookie));
        auto before=writes;RefreshCaptions();assert(captions.empty()&&GetPropW(window,captionProperty)==cookie&&writes==before);
        RemovePropW(window,captionProperty);assert(DestroyWindow(window)&&DestroyWindow(wrong));
        assert(UnregisterClassW(type.lpszClassName,type.hInstance));
        puts("PASS: approved existing Notepad default reset; exact genuine receipts, package/runtime/HC/child/foreign refusal, collision, HWND reuse and recovery");return 0;
    }
#endif
    if(strcmp(argv[1],"native-caption-capture") == 0) {
        WNDCLASSW type{};type.lpfnWndProc=DefWindowProcW;type.hInstance=GetModuleHandleW(nullptr);
        type.lpszClassName=J3W1_TEST_PAINT?L"MSPaintApp":L"Notepad";assert(RegisterClassW(&type));
        HWND window=CreateWindowExW(0,type.lpszClassName,L"",WS_POPUP,0,0,20,20,nullptr,nullptr,type.hInstance,nullptr);assert(window);
        static DWORD backdrop=DWMSBT_TABBEDWINDOW,caption=DWMWA_COLOR_DEFAULT;static bool fail=false;static unsigned reads=0;
        nativeDwmGet=+[](HWND,DWORD attribute,PVOID value,DWORD size)->HRESULT {
            assert(attribute==DWMWA_SYSTEMBACKDROP_TYPE&&size==sizeof(DWORD));++reads;memcpy(value,&backdrop,size);return S_OK;
        };
        originalDwmSet=+[](HWND,DWORD attribute,LPCVOID value,DWORD size)->HRESULT {
            assert(size==sizeof(DWORD));if(fail)return E_FAIL;
            if(attribute==DWMWA_CAPTION_COLOR)memcpy(&caption,value,size);
            else {assert(attribute==DWMWA_SYSTEMBACKDROP_TYPE);memcpy(&backdrop,value,size);}return S_OK;
        };
        enabled=true;DWORD requested=DWMSBT_MAINWINDOW;
        assert(SUCCEEDED(DwmCaptionHook(window,DWMWA_SYSTEMBACKDROP_TYPE,&requested,sizeof(requested))));
        assert(backdrop==requested&&reads==0&&!OwnedCaption(window)); // Unknown caption cannot grant ownership.
        COLORREF color=RGB(1,2,3);fail=true;
        assert(FAILED(DwmCaptionHook(window,DWMWA_CAPTION_COLOR,&color,sizeof(color)))&&!OwnedCaption(window));
        fail=false;assert(SUCCEEDED(DwmCaptionHook(window,DWMWA_CAPTION_COLOR,&color,sizeof(color))));
        if(J3W1_TEST_PAINT){assert(!OwnedCaption(window)&&caption==color&&reads==0);}
        else {
            auto state=OwnedCaption(window);assert(state&&state->before==color&&state->applied);
            assert(caption==RGB(0,0,0)&&backdrop==DWMSBT_NONE&&state->backdrop.before==DWMSBT_MAINWINDOW);
            requested=DWMSBT_TABBEDWINDOW;
            assert(SUCCEEDED(DwmCaptionHook(window,DWMWA_SYSTEMBACKDROP_TYPE,&requested,sizeof(requested))));
            assert(backdrop==DWMSBT_NONE&&state->backdrop.before==requested);
            enabled=false;RefreshCaptions();assert(caption==color&&backdrop==requested&&!state->applied&&!state->backdrop.owned);
            enabled=true;RefreshCaptions();assert(caption==RGB(0,0,0)&&backdrop==DWMSBT_NONE);
            backdrop=DWMSBT_MAINWINDOW;assert(ForgetCaption(state,true));
            assert(caption==color&&backdrop==DWMSBT_MAINWINDOW&&!GetPropW(window,captionProperty));
        }
        assert(DestroyWindow(window));originalCreateWindow=CreateWindowExW;
        enabled=false;
        window=CreateCaptionHook(0,type.lpszClassName,L"",WS_POPUP,0,0,20,20,nullptr,nullptr,type.hInstance,nullptr);
        assert(window&&!OwnedCaption(window));assert(DestroyWindow(window));
        enabled=true;
        window=CreateCaptionHook(0,type.lpszClassName,L"",WS_POPUP,0,0,20,20,nullptr,nullptr,type.hInstance,nullptr);assert(window);
        if(J3W1_TEST_PAINT)assert(!OwnedCaption(window));
        else {auto state=OwnedCaption(window);assert(state&&state->before==DWMWA_COLOR_DEFAULT);assert(ForgetCaption(state,true));}
        assert(DestroyWindow(window)&&UnregisterClassW(type.lpszClassName,type.hInstance));
        puts("PASS: unknown/disabled windows pass through, exact creation baseline, failed capture, later app requests and Paint refusal");return 0;
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
        assert(window);
        assert(PublicCaptionWindow(window));
        assert(CaptionWindow(window)==!bool(J3W1_TEST_PAINT));
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
        assert(calls==6);
        // Public-caption writes must bypass native capture in either adapter.
        // Native application requests are exercised in native-caption-capture.
        CaptionWriteGuard publicWriter;
        for(bool active:{false,true}) {
            DWORD nativeColor=RGB(31,33,35);enabled=active;
            assert(SUCCEEDED(DwmCaptionHook(window,DWMWA_CAPTION_COLOR,&nativeColor,sizeof(nativeColor))));
            assert(attributeSeen==DWMWA_CAPTION_COLOR&&valueSeen==nativeColor);
        }
        assert(calls==8&&captions.empty());
        assert(DestroyWindow(window));assert(UnregisterClassW(type.lpszClassName,type.hInstance));
        puts("PASS: native backdrop requests preserved in active and inactive adapter states");return 0;
    }
    if(strcmp(argv[1], "discovery-admission") == 0) {
        for(auto popup:{L"Microsoft.UI.Xaml.Controls.MenuFlyoutPresenter",L"Microsoft.UI.Xaml.Controls.MenuFlyoutItem",L"Microsoft.UI.Xaml.Controls.MenuFlyoutSubItem",L"Microsoft.UI.Xaml.Controls.FlyoutPresenter",L"Microsoft.UI.Xaml.Controls.ToolTip"}) {
            assert(PopupDiscoveryAdmission(popup,true,true,true,true));
            assert(!PopupDiscoveryAdmission(popup,false,true,true,true));
            assert(!PopupDiscoveryAdmission(popup,true,false,true,true));
            assert(!PopupDiscoveryAdmission(popup,true,true,false,true));
            assert(!PopupDiscoveryAdmission(popup,true,true,true,false));
        }
        for(auto rejected:{L"PaintUI.D2DSwapChainPanel",L"PaintUI.ColorRadioButton",L"NotepadXamlUI.Document",L"Microsoft.UI.Xaml.Controls.Grid",L"Microsoft.UI.Xaml.Controls.MenuFlyoutPresenterExtra",L"Microsoft.UI.Xaml.Controls.FlyoutPresenterExtra",L"Microsoft.UI.Xaml.Controls.ToolTipExtra"})
            assert(!PopupDiscoveryAdmission(rejected,true,true,true,true));
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
        for(auto owner:{L"PaintUI.BrushSizeSlider",L"PaintUI.PercentageSlider"}){
            matches(PaintSliderBackingKey(L"Microsoft.UI.Xaml.Controls.Grid",owner,Kind::Background,{255,44,44,44}),L"SolidBackgroundFillColorBaseBrush");
            assert(!PaintSliderBackingKey(L"PaintUI.D2DSwapChainPanel",owner,Kind::Background,{255,44,44,44}));
            assert(!PaintSliderBackingKey(L"Microsoft.UI.Xaml.Controls.Grid",owner,Kind::Border,{255,44,44,44}));
            assert(!PaintSliderBackingKey(L"Microsoft.UI.Xaml.Controls.Grid",owner,Kind::Background,{254,44,44,44}));
            assert(!PaintSliderBackingKey(L"Microsoft.UI.Xaml.Controls.Grid",owner,Kind::Background,{255,45,44,44}));
        }
        for(auto owner:{L"PaintUI.ColorRadioButton",L"PaintUI.Canvas",L"PaintUI.AppChrome",L"Microsoft.UI.Xaml.Controls.Grid"})assert(!PaintSliderBackingKey(L"Microsoft.UI.Xaml.Controls.Grid",owner,Kind::Background,{255,44,44,44}));
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
        auto settings=L"NotepadXamlUI.NotepadSettingsPage",scroll=L"Microsoft.UI.Xaml.Controls.ScrollViewer";
        assert(NotepadSettingsBackingAdmission(settings,scroll,L"RootScrollViewer",1,true));
        assert(!NotepadSettingsBackingAdmission(settings,scroll,L"RootScrollViewer",1,false));
        assert(!NotepadSettingsBackingAdmission(settings,scroll,L"RootScrollViewer",2,true));
        assert(!NotepadSettingsBackingAdmission(settings,scroll,L"DocumentScrollViewer",1,true));
        assert(!NotepadSettingsBackingAdmission(L"NotepadXamlUI.Document",scroll,L"RootScrollViewer",1,true));
        assert(!NotepadSettingsBackingAdmission(settings,L"Microsoft.UI.Xaml.Controls.Grid",L"RootScrollViewer",1,true));
        auto panel=L"NotepadXamlUI.ExpanderExQuadratePanel",grid=L"Microsoft.UI.Xaml.Controls.Grid",expander=L"NotepadXamlUI.ExpanderEx";
        assert(NotepadSettingsSurfaceKey(settings,panel,grid,expander,Kind::Background,{13,255,255,255}));
        assert(NotepadSettingsSurfaceKey(settings,grid,panel,grid,Kind::Background,{13,255,255,255}));
        assert(!NotepadSettingsSurfaceKey(L"NotepadXamlUI.Document",panel,grid,expander,Kind::Background,{13,255,255,255}));
        assert(!NotepadSettingsSurfaceKey(settings,panel,grid,expander,Kind::Foreground,{13,255,255,255}));
        assert(!NotepadSettingsSurfaceKey(settings,panel,grid,expander,Kind::Background,{14,255,255,255}));
        assert(!NotepadSettingsSurfaceKey(settings,L"Microsoft.UI.Xaml.Controls.Button",grid,expander,Kind::Background,{13,255,255,255}));
        assert(!NotepadSettingsSurfaceKey(settings,panel,grid,L"Unrelated",Kind::Background,{13,255,255,255}));
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
