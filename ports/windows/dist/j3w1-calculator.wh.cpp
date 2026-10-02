// ==WindhawkMod==
// @id j3w1-calculator
// @name j3w1 Calculator resources
// @description Version-checked Calculator UI resources; equation colors remain native
// @version 1.4.2
// @author j3w1
// @include CalculatorApp.exe
// @architecture x86-64
// @compilerOptions -lcomctl32 -lole32 -loleaut32 -lruntimeobject
// ==/WindhawkMod==
// ==WindhawkModSettings==
/*
- enabled: true
*/
// ==/WindhawkModSettings==
#include <windows.h>
#include <appmodel.h>
#include <cstdio>
#undef GetCurrentTime
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>
#include <winrt/Windows.UI.Xaml.h>
#include <winrt/Windows.UI.Xaml.Controls.h>
#include <winrt/Windows.UI.Xaml.Automation.h>
#include <winrt/Windows.UI.Xaml.Controls.Primitives.h>
#include <winrt/Windows.UI.Xaml.Markup.h>
#include <winrt/Windows.UI.Xaml.Media.h>
#include <winrt/Windows.UI.Xaml.Shapes.h>
#include <winrt/Windows.UI.Xaml.Media.Animation.h>
#include <winrt/Windows.UI.ViewManagement.h>
#include <vector>
#include <deque>
#include <string>
#include <atomic>

using namespace winrt;
using namespace Windows::UI;
using namespace Windows::UI::Xaml;
using namespace Windows::UI::Xaml::Media;
using namespace Windows::UI::Xaml::Controls;
using Windows::Foundation::IInspectable;
struct Rule { const wchar_t* key; Color color; const wchar_t* role; };
static constexpr Rule rules[] = {
    {L"AppChromeAcrylicHostBackdropMediumLowBrush",{255,0,0,0},L"color.surface.canvas"},
    {L"AppBackgroundAltMediumLowBrush",{255,0,0,0},L"color.surface.canvas"},
    {L"AppOperatorPanelBackground",{255,0,0,0},L"color.surface.canvas"},
    {L"SystemControlBackgroundAltHighBrush",{255,0,0,0},L"color.surface.canvas"},
    {L"SystemControlBackgroundChromeMediumLowBrush",{255,0,0,0},L"color.surface.canvas"},
    {L"SolidBackgroundFillColorBaseBrush",{255,0,0,0},L"color.surface.canvas"},
    {L"AppChromeAcrylicOperatorFlyoutBackgroundBrush",{255,22,11,11},L"color.surface.raised"},
    {L"NavigationViewDefaultPaneBackground",{255,0,0,0},L"color.surface.canvas"},
    {L"CalcButtonTextFillColorDefaultBrush",{255,233,148,153},L"color.text.default"},
    {L"CalcButtonTextFillColorHoverBrush",{255,233,148,153},L"color.text.default"},
    {L"AppControlPageTextBaseHighColorBrush",{255,233,148,153},L"color.text.default"},
    {L"TextFillColorPrimaryBrush",{255,233,148,153},L"color.text.default"},
    {L"CalcButtonTextFillColorPressedBrush",{255,189,120,125},L"color.text.muted"},
    {L"AppControlPageTextBaseMediumHighBrush",{255,189,120,125},L"color.text.muted"},
    {L"AppControlForegroundSecondaryBrush",{255,189,120,125},L"color.text.muted"},
    {L"TextFillColorSecondaryBrush",{255,189,120,125},L"color.text.muted"},
    {L"CalcButtonTextFillColorDisabledBrush",{255,138,85,89},L"color.text.disabled"},
    {L"TextFillColorDisabledBrush",{255,138,85,89},L"color.text.disabled"},
    {L"AppControlForegroundAccentBrush",{255,255,162,167},L"color.text.bright"},
    {L"AccentTextFillColorPrimaryBrush",{255,255,162,167},L"color.text.bright"},
    {L"TextOnAccentFillColorPrimaryBrush",{255,255,162,167},L"color.text.bright"},
    {L"TextOnAccentFillColorSecondaryBrush",{255,255,162,167},L"color.text.bright"},
    {L"CalcButtonFillColorDefaultBrush",{255,0,0,0},L"color.surface.input"},
    {L"CalcButtonAltFillColorDefaultBrush",{255,0,0,0},L"color.surface.input"},
    {L"CalcButtonFillColorHoverBrush",{255,28,10,9},L"color.interaction.hover.bg"},
    {L"CalcButtonAltFillColorHoverBrush",{255,28,10,9},L"color.interaction.hover.bg"},
    {L"SubtleFillColorSecondaryBrush",{255,28,10,9},L"color.interaction.hover.bg"},
    {L"AppControlBackgroundSecondaryBrush",{255,28,10,9},L"color.interaction.hover.bg"},
    {L"CalcButtonFillColorPressedBrush",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"CalcButtonAltFillColorPressedBrush",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"AppControlBackgroundTertiaryBrush",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"SubtleFillColorTertiaryBrush",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"CalcButtonFillColorDisabledBrush",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"CalcButtonAltFillColorDisabledBrush",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"AccentFillColorDefaultBrush",{255,125,19,16},L"color.action.primary.bg"},
    {L"AppControlHighlightCalcButtonBrush",{255,125,19,16},L"color.action.primary.bg"},
    {L"AppControlHighlightCalcButtonToggledBrush",{255,125,19,16},L"color.action.primary.bg"},
    {L"AccentFillColorSecondaryBrush",{255,145,20,16},L"color.action.primary.hover-bg"},
    {L"AppControlHighlightCalcButtonHoverBrush",{255,145,20,16},L"color.action.primary.hover-bg"},
    {L"AccentFillColorTertiaryBrush",{255,99,15,13},L"color.action.primary.pressed-bg"},
    {L"ControlStrokeColorDefaultBrush",{255,163,103,107},L"color.border.control"},
    {L"SystemControlHighlightAccentBrush",{255,229,57,53},L"color.border.active"},
    {L"SystemControlPageTextBaseHighBrush",{255,233,148,153},L"color.text.default"},
    {L"SystemControlPageTextBaseMediumBrush",{255,189,120,125},L"color.text.muted"},
    {L"SystemControlForegroundBaseHighBrush",{255,233,148,153},L"color.text.default"},
    {L"ButtonBorderBrush",{255,163,103,107},L"color.border.control"},
    {L"ButtonBorderBrushPointerOver",{255,229,57,53},L"color.border.active"},
    {L"ButtonBorderBrushPressed",{255,229,57,53},L"color.border.active"},
    {L"ButtonBorderBrushDisabled",{255,125,19,16},L"color.border.disabled"},
    {L"DividerStrokeColorDefaultBrush",{255,43,14,13},L"color.border.divider"},
    {L"SystemControlFocusVisualPrimaryBrush",{255,229,57,53},L"color.interaction.focus.ring"},
    {L"SystemControlFocusVisualSecondaryBrush",{255,0,0,0},L"color.surface.canvas"},
    {L"NavigationViewExpandedPaneBackground",{255,0,0,0},L"color.surface.canvas"},
    {L"NavigationViewTopPaneBackground",{255,0,0,0},L"color.surface.canvas"},
    {L"ControlStrokeColorSecondaryBrush",{255,163,103,107},L"color.border.control"},
    {L"ControlElevationBorderBrush",{255,163,103,107},L"color.border.control"},
    {L"ToolTipBackground",{255,36,16,16},L"color.surface.overlay"},
    {L"ToolTipForeground",{255,233,148,153},L"color.text.default"},
    {L"ToolTipBorderBrush",{255,163,103,107},L"color.border.control"},
    {L"NavigationViewItemBackground",{255,0,0,0},L"color.surface.canvas"},
    {L"NavigationViewItemForeground",{255,233,148,153},L"color.text.default"},
    {L"NavigationViewItemBackgroundPointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
    {L"NavigationViewItemForegroundPointerOver",{255,233,148,153},L"color.text.default"},
    {L"NavigationViewItemBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"NavigationViewItemForegroundPressed",{255,189,120,125},L"color.text.muted"},
    {L"NavigationViewItemBackgroundDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"NavigationViewItemForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
    {L"NavigationViewItemBackgroundChecked",{255,83,19,16},L"color.interaction.selection.bg"},
    {L"NavigationViewItemForegroundChecked",{255,244,238,238},L"color.interaction.selection.text"},
    {L"NavigationViewItemBackgroundCheckedPointerOver",{255,83,19,16},L"color.interaction.selection.bg"},
    {L"NavigationViewItemForegroundCheckedPointerOver",{255,244,238,238},L"color.interaction.selection.text"},
    {L"NavigationViewItemBackgroundCheckedPressed",{255,83,19,16},L"color.interaction.selection.bg"},
    {L"NavigationViewItemForegroundCheckedPressed",{255,244,238,238},L"color.interaction.selection.text"},
    {L"NavigationViewItemBackgroundCheckedDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"NavigationViewItemForegroundCheckedDisabled",{255,138,85,89},L"color.text.disabled"},
    {L"NavigationViewItemBackgroundSelected",{255,83,19,16},L"color.interaction.selection.bg"},
    {L"NavigationViewItemForegroundSelected",{255,244,238,238},L"color.interaction.selection.text"},
    {L"NavigationViewItemBackgroundSelectedPointerOver",{255,83,19,16},L"color.interaction.selection.bg"},
    {L"NavigationViewItemForegroundSelectedPointerOver",{255,244,238,238},L"color.interaction.selection.text"},
    {L"NavigationViewItemBackgroundSelectedPressed",{255,83,19,16},L"color.interaction.selection.bg"},
    {L"NavigationViewItemForegroundSelectedPressed",{255,244,238,238},L"color.interaction.selection.text"},
    {L"NavigationViewItemBackgroundSelectedDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"NavigationViewItemForegroundSelectedDisabled",{255,138,85,89},L"color.text.disabled"},
    {L"NavigationViewItemSeparatorForeground",{255,43,14,13},L"color.border.divider"},
    {L"NavigationViewContentBackground",{255,0,0,0},L"color.surface.canvas"},
    {L"NavigationViewItemHeaderForeground",{255,189,120,125},L"color.text.muted"},
    {L"NavigationViewContentGridBorderBrush",{255,43,14,13},L"color.border.divider"},
    {L"NavigationViewSelectionIndicatorForeground",{255,229,57,53},L"color.border.active"},
};
static std::atomic<bool> enabled{false}, admitted{false};
static std::atomic<HWND> coreWindow{nullptr};
static UINT dispatchMessage=0;
static decltype(&DefWindowProcW) originalDefWindowProc;
static HANDLE discoveryStop=nullptr;
// Plain handles have no teardown destructor when the host process exits.
static HANDLE discovery=nullptr;
// XAML references are acquired, changed and released only on the owning UI thread.
struct ResourceChange {
    ResourceDictionary dictionary{nullptr};
    hstring key;
    IInspectable before{nullptr};
    SolidColorBrush applied{nullptr};
    std::vector<Brush> aliases;
    const Rule* rule=nullptr;
    bool local=false;
};
struct VisualChange {
    weak_ref<DependencyObject> object;
    DependencyProperty property{nullptr};
    IInspectable before{nullptr};
    Brush applied{nullptr};
};
[[clang::no_destroy]] static std::vector<ResourceChange> resourcesChanged;
[[clang::no_destroy]] static ResourceDictionary applicationResources{nullptr},ownedOverrides{nullptr};
[[clang::no_destroy]] static std::vector<VisualChange> visualsChanged;
[[clang::no_destroy]] static FrameworkElement observedRoot{nullptr};
static event_token layoutToken{};
[[clang::no_destroy]] static Window observedWindow{nullptr};
static event_token closedToken{};
[[clang::no_destroy]] static Control page{nullptr};
[[clang::no_destroy]] static IInspectable pageBefore{nullptr};
[[clang::no_destroy]] static SolidColorBrush pageApplied{nullptr};
[[clang::no_destroy]] static Windows::UI::Xaml::Markup::IXamlMember backdrop{nullptr};
[[clang::no_destroy]] static IInspectable backdropBefore{nullptr};
[[clang::no_destroy]] static Windows::UI::ViewManagement::ApplicationViewTitleBar titleBar{nullptr};
[[clang::no_destroy]] static Windows::Foundation::IReference<Color> titleBefore[4];
static bool busy=false;
static unsigned admissionAttempts=0;

static bool Identity(IInspectable const& a,IInspectable const& b) {
    return a && b && get_abi(a.as<Windows::Foundation::IUnknown>())==get_abi(b.as<Windows::Foundation::IUnknown>());
}
static bool Same(Color a,Color b) {return a.A==b.A&&a.R==b.R&&a.G==b.G&&a.B==b.B;}
static Color CanvasColor() {
    for(auto const& rule:rules)if(wcscmp(rule.key,L"SolidBackgroundFillColorBaseBrush")==0)return rule.color;
    throw hresult_error(E_INVALIDARG);
}
static bool HighContrast() {
    HIGHCONTRASTW value{sizeof(value)};
    return !SystemParametersInfoW(SPI_GETHIGHCONTRAST,sizeof(value),&value,0) || (value.dwFlags&HCF_HIGHCONTRASTON);
}
static bool ReviewedPackage() {
    UINT32 length=0;
    if(GetCurrentPackageFullName(&length,nullptr)!=ERROR_INSUFFICIENT_BUFFER || length>512)return false;
    std::vector<wchar_t> name(length);
    return GetCurrentPackageFullName(&length,name.data())==ERROR_SUCCESS && wcscmp(name.data(),L"Microsoft.WindowsCalculator_11.2607.0.0_x64__8wekyb3d8bbwe") == 0;
}
static std::vector<ResourceDictionary> AliasDictionaries(ResourceDictionary const& root) {
    std::vector<ResourceDictionary> result,queue{root};
    for(unsigned at=0;at<queue.size();at++) {
        if(at>=16)throw hresult_error(E_INVALIDARG);
        auto dictionary=queue[at];bool seen=false;
        for(auto const& prior:result)if(Identity(prior,dictionary)){seen=true;break;}
        if(seen)continue;
        result.push_back(dictionary);
        for(auto theme:{L"Default",L"Dark"}) {
            auto child=dictionary.ThemeDictionaries().TryLookup(box_value(theme)).try_as<ResourceDictionary>();
            if(child)queue.push_back(child);
        }
        auto merged=dictionary.MergedDictionaries();if(merged.Size()>8)throw hresult_error(E_INVALIDARG);
        for(auto child:merged)queue.push_back(child);
    }
    return result;
}
static Control CurrentPage() {
    auto content=Window::Current().Content();
    if(auto frame=content.try_as<Frame>())content=frame.Content().try_as<UIElement>();
    return content.try_as<Page>();
}
static bool RestorePage() noexcept {
    bool restored=true;
    bool backgroundOwned=false;
    if(page && pageApplied)try {
        backgroundOwned=Identity(page.GetValue(Control::BackgroundProperty()),pageApplied);
    }catch(...){restored=false;}
    // The backdrop setter can rewrite the page's local background. Restore it
    // first, then the saved local value, only while we still own that value.
    if(backdrop && page)try {
        if(!unbox_value<bool>(backdrop.GetValue(page)))backdrop.SetValue(page,backdropBefore);
    }catch(...){restored=false;}
    // Preserve later host changes; never replace a binding with its effective value.
    if(page && pageApplied)try {
        if(backgroundOwned) {
            if(Identity(pageBefore,DependencyProperty::UnsetValue()))page.ClearValue(Control::BackgroundProperty());
            else page.SetValue(Control::BackgroundProperty(),pageBefore);
        }
    }catch(...){restored=false;}
    if(titleBar) {
        auto applied=CanvasColor();
        try {auto value=titleBar.BackgroundColor();if(value&&Same(value.Value(),applied))titleBar.BackgroundColor(titleBefore[0]);}catch(...){restored=false;}
        try {auto value=titleBar.InactiveBackgroundColor();if(value&&Same(value.Value(),applied))titleBar.InactiveBackgroundColor(titleBefore[1]);}catch(...){restored=false;}
        try {auto value=titleBar.ButtonBackgroundColor();if(value&&Same(value.Value(),applied))titleBar.ButtonBackgroundColor(titleBefore[2]);}catch(...){restored=false;}
        try {auto value=titleBar.ButtonInactiveBackgroundColor();if(value&&Same(value.Value(),applied))titleBar.ButtonInactiveBackgroundColor(titleBefore[3]);}catch(...){restored=false;}
    }
    if(!restored)return false;
    for(auto& value:titleBefore)value=nullptr;
    titleBar=nullptr;backdrop=nullptr;backdropBefore=nullptr;pageApplied=nullptr;pageBefore=nullptr;page=nullptr;
    return true;
}
static void ApplyPage() {
    auto current=CurrentPage();
    if(!current)throw hresult_error(E_INVALIDARG);
    if(Identity(current,page))return;
    if(!RestorePage())throw hresult_error(E_FAIL);
    auto before=current.ReadLocalValue(Control::BackgroundProperty());
    if(!Identity(before,DependencyProperty::UnsetValue()) && !before.try_as<Brush>())throw hresult_error(E_INVALIDARG);
    auto provider=Application::Current().try_as<Windows::UI::Xaml::Markup::IXamlMetadataProvider>();
    auto type=provider?provider.GetXamlType(L"Microsoft.UI.Xaml.Controls.BackdropMaterial"):nullptr;
    auto member=type?type.GetMember(L"ApplyToRootOrPageBackground"):nullptr;
    if(!member)throw hresult_error(E_NOINTERFACE);
    auto value=member.GetValue(current);
    unbox_value<bool>(value); // Refuse an unknown attached-property type before mutation.
    page=current;pageBefore=before;backdrop=member;backdropBefore=value;
    backdrop.SetValue(page,box_value(false));
    pageApplied=SolidColorBrush(CanvasColor());page.Background(pageApplied);
    titleBar=Windows::UI::ViewManagement::ApplicationView::GetForCurrentView().TitleBar();
    titleBefore[0]=titleBar.BackgroundColor();titleBefore[1]=titleBar.InactiveBackgroundColor();
    titleBefore[2]=titleBar.ButtonBackgroundColor();titleBefore[3]=titleBar.ButtonInactiveBackgroundColor();
    auto canvas=box_value(CanvasColor()).as<Windows::Foundation::IReference<Color>>();
    titleBar.BackgroundColor(canvas);titleBar.InactiveBackgroundColor(canvas);
    titleBar.ButtonBackgroundColor(canvas);titleBar.ButtonInactiveBackgroundColor(canvas);
}
enum class PropertyKind { Background, Foreground, Border, FocusPrimary, FocusSecondary };
static bool Matches(Rule const& rule,PropertyKind kind) {
    if(kind==PropertyKind::FocusPrimary)return wcscmp(rule.key,L"SystemControlFocusVisualPrimaryBrush")==0;
    if(kind==PropertyKind::FocusSecondary)return wcscmp(rule.key,L"SystemControlFocusVisualSecondaryBrush")==0;
    if(wcsstr(rule.key,L"FocusVisual"))return false;
    if(kind==PropertyKind::Foreground)return wcsncmp(rule.role,L"color.text.",11)==0;
    if(kind==PropertyKind::Border)return wcsncmp(rule.role,L"color.border.",13)==0;
    return wcsncmp(rule.role,L"color.surface.",14)==0 || wcsstr(rule.role,L".bg")!=nullptr;
}
struct OwnedThemeRefresh {
 weak_ref<FrameworkElement> element;
 IInspectable before{nullptr};
 ElementTheme requested=ElementTheme::Default;
 bool pending=false,complete=false;
};
static bool SameLocalTheme(IInspectable const& local,ElementTheme theme) {
 auto value=local.try_as<Windows::Foundation::IReference<ElementTheme>>();
 return value&&value.Value()==theme;
}
static bool RestoreThemeRefresh(OwnedThemeRefresh& entry) noexcept {
 if(!entry.pending)return true;
 try {
  if(auto element=entry.element.get()) {
   auto property=FrameworkElement::RequestedThemeProperty();
   auto current=element.ReadLocalValue(property);
   // Preserve a synchronous application change made during theme notification.
   if(SameLocalTheme(current,entry.requested)) {
    if(!entry.before||Identity(entry.before,DependencyProperty::UnsetValue()))element.ClearValue(property);
    else element.SetValue(property,entry.before);
   }
  }
  entry.pending=false;return true;
 }catch(...){return false;}
}
static bool RefreshThemeSource(OwnedThemeRefresh& entry) noexcept {
 if(entry.complete)return !entry.pending;
 if(!RestoreThemeRefresh(entry))return false;
 try {
  auto element=entry.element.get();if(!element){entry.complete=true;return true;}
  auto property=FrameworkElement::RequestedThemeProperty();
  auto local=element.ReadLocalValue(property);
  if(local&&!Identity(local,DependencyProperty::UnsetValue())&&!local.try_as<Windows::Foundation::IReference<ElementTheme>>())return false;
  entry.before=local;
  entry.requested=element.ActualTheme()==ElementTheme::Dark?ElementTheme::Light:ElementTheme::Dark;
  entry.pending=true;
  element.RequestedTheme(entry.requested);
  if(!RestoreThemeRefresh(entry))return false;
  entry.complete=true;return true;
 }catch(...){RestoreThemeRefresh(entry);return false;}
}

struct ControlKey {
 hstring key; IInspectable before{nullptr},applied{nullptr}; bool local=false,owned=false;
};
struct ControlResources {
 weak_ref<FrameworkElement> element; ResourceDictionary owner{nullptr}; std::vector<ControlKey> keys; OwnedThemeRefresh refresh;
};
struct LocalResourceValue { bool exists=false; IInspectable value{nullptr}; };
static LocalResourceValue LocalResource(ResourceDictionary const& owner,hstring const& key) {
 // Lookup may resolve an inherited value. Enumeration records only local keys,
 // including explicitly present null values, so rollback restores exact state.
 for(auto const& pair:owner)if(auto name=pair.Key().try_as<Windows::Foundation::IReference<hstring>>();name&&name.Value()==key)return {true,pair.Value()};
 return {};
}
template<class Read,class Write> static bool ApplyControlKey(ControlKey& key,Read read,Write write) noexcept {
 if(key.owned)return true;
 try {
  auto before=read();key.before=before.value;key.local=before.exists;
  // Ownership precedes the write: a setter can mutate and then throw.
  key.owned=true;write(key.applied);return true;
 }catch(...){return false;}
}
template<class Read,class Write,class Remove> static bool RestoreControlKey(ControlKey& key,Read read,Write write,Remove remove) noexcept {
 if(!key.owned)return true;
 try {
  auto current=read();
  // The application owns a replacement or deletion made after our write.
  if(current.exists&&Identity(current.value,key.applied)) {
   if(key.local)write(key.before);else remove();
  }
  key.owned=false;return true;
 }catch(...){return false;}
}
static bool RestoreControlResources(ControlResources& entry) noexcept {
 bool restored=RestoreThemeRefresh(entry.refresh);
 for(auto& key:entry.keys)
  restored=RestoreControlKey(key,[&]{return LocalResource(entry.owner,key.key);},
   [&](auto const& value){entry.owner.Insert(box_value(key.key),value);},
   [&]{entry.owner.Remove(box_value(key.key));})&&restored;
 if(restored){entry.keys.clear();entry.owner=nullptr;}
 return restored;
}


[[clang::no_destroy]] static std::deque<ControlResources> controlsChanged;
static bool ChromeControl(DependencyObject const& object) {
    auto type=get_class_name(object);
    // Pane ThemeResources resolve at NavigationView, above its row controls.
    if(type==L"Microsoft.UI.Xaml.Controls.NavigationView"
        ||type==L"Microsoft.UI.Xaml.Controls.NavigationViewItemHeader"
        ||type==L"Microsoft.UI.Xaml.Controls.NavigationViewItem"
        ||type==L"Microsoft.UI.Xaml.Controls.Primitives.NavigationViewItemPresenter")return true;
    return object.try_as<Windows::UI::Xaml::Controls::Primitives::ButtonBase>()
        ||object.try_as<MenuFlyoutPresenter>()||object.try_as<MenuFlyoutItem>()||object.try_as<MenuFlyoutSubItem>()
        ||object.try_as<ToggleSwitch>()||object.try_as<ComboBox>()||object.try_as<ListViewItem>()
        ||object.try_as<TextBlock>()||object.try_as<IconElement>();
}
static void RefreshControlResources(DependencyObject const& object) {
    if(!ChromeControl(object))return;
    auto element=object.try_as<FrameworkElement>();if(!element||!element.IsLoaded())return;
    for(auto& prior:controlsChanged)if(Identity(prior.element.get(),element)) {
        if(!prior.refresh.complete&&!RefreshThemeSource(prior.refresh))throw hresult_error(E_FAIL);
        return;
    }
    if(controlsChanged.size()>=1024)throw hresult_error(E_BOUNDS);
    controlsChanged.push_back({make_weak(element),element.Resources(),{}, {make_weak(element)}});
    auto& entry=controlsChanged.back();
    // Framework theme keys can exist below Application.Resources. Supply the
    // exact declared UI keys locally even when app-level lookup cannot find them.
    // Each absent/null/existing local entry is independently restored.
    for(auto const& rule:rules) {
        auto key=hstring(rule.key);
        entry.keys.push_back({key,nullptr,SolidColorBrush(rule.color)});auto& owned=entry.keys.back();
        if(!ApplyControlKey(owned,[&]{return LocalResource(entry.owner,key);},
            [&](auto const& value){entry.owner.Insert(box_value(key),value);}))throw hresult_error(E_FAIL);
    }
    if(!RefreshThemeSource(entry.refresh))throw hresult_error(E_FAIL);
}

struct ControlStyleChange { weak_ref<FrameworkElement> object; ControlKey value; };
[[clang::no_destroy]] static std::deque<ControlStyleChange> stylesChanged;
static Rule const& PaletteRule(PCWSTR key) {
 for(auto const& rule:rules)if(wcscmp(rule.key,key)==0)return rule;
 throw hresult_error(E_INVALIDARG);
}
static std::wstring PaletteHex(PCWSTR key) {
 auto color=PaletteRule(key).color;wchar_t value[10];
 swprintf_s(value,L"#%02X%02X%02X%02X",color.A,color.R,color.G,color.B);return value;
}
static LocalResourceValue LocalStyle(FrameworkElement const& element) {
 auto value=element.ReadLocalValue(FrameworkElement::StyleProperty());
 return {value&&!Identity(value,DependencyProperty::UnsetValue()),value};
}


static unsigned KnownState(hstring const& name) {
 if(name==L"Normal")return 1;if(name==L"PointerOver")return 2;
 if(name==L"Pressed")return 3;if(name==L"Disabled")return 4;return 0;
}

using namespace Windows::UI::Xaml::Media::Animation;
struct AnimationFrameValue { bool exists=false; IInspectable value{nullptr}; };
struct OwnedAnimationFrame { IInspectable original{nullptr},applied{nullptr};bool owned=false; };
template<class Read,class Write> static bool ApplyAnimationFrame(OwnedAnimationFrame& entry,Read read,Write write) noexcept {
 if(entry.owned)return true;
 try {auto current=read();if(!current.exists||!Identity(current.value,entry.original))return false;
  entry.owned=true;write(entry.applied);return true;
 }catch(...){return false;}
}
template<class Read,class Write> static bool RestoreAnimationFrame(OwnedAnimationFrame& entry,Read read,Write write) noexcept {
 if(!entry.owned)return true;
 try {auto current=read();if(current.exists&&Identity(current.value,entry.applied))write(entry.original);
  entry.owned=false;return true;
 }catch(...){return false;}
}
// The native storyboard retains its core timeline, not its transient WinRT
// peer. Keep the peer alive until its owned keyframe has been restored.

template<class Read,class Stop> static bool EnsureStoppedClock(Read read,Stop stop) noexcept {
 try {auto current=read();if(current==ClockState::Stopped)return true;
  if(current!=ClockState::Active&&current!=ClockState::Filling)return false;
  stop();return read()==ClockState::Stopped;}catch(...){return false;}
}
template<class Read,class Write,class Clock> static bool ApplyStoppedAnimationFrame(OwnedAnimationFrame& frame,Read read,Write write,Clock clock) noexcept {
 try {if(clock()!=ClockState::Stopped)return false;return ApplyAnimationFrame(frame,read,write);}catch(...){return false;}
}
template<class Read,class Write,class Clock> static bool RestoreStoppedAnimationFrame(OwnedAnimationFrame& frame,Read read,Write write,Clock clock) noexcept {
 try {if(clock()!=ClockState::Stopped)return false;return RestoreAnimationFrame(frame,read,write);}catch(...){return false;}
}
struct NativeStateRefresh {weak_ref<Button> button;VisualStateGroup group{nullptr};hstring state;};
static bool ReviewedColorStoryboard(Storyboard const& storyboard) {
 if(!storyboard||storyboard.Children().Size()!=3)return false;unsigned mask=0;
 for(auto const& child:storyboard.Children()) {
  auto animation=child.try_as<ObjectAnimationUsingKeyFrames>();
  if(!animation||Storyboard::GetTargetName(animation)!=L"ContentPresenter"||animation.KeyFrames().Size()!=1)return false;
  auto frame=animation.KeyFrames().GetAt(0).try_as<DiscreteObjectKeyFrame>();if(!frame||frame.KeyTime().TimeSpan.count()!=0||!frame.Value().try_as<Brush>())return false;
  auto property=Storyboard::GetTargetProperty(animation);
  unsigned bit=property==L"Background"?1:property==L"Foreground"?2:property==L"BorderBrush"?4:0;
  if(!bit||(mask&bit))return false;mask|=bit;
 }
 return mask==7;
}
static bool StopNativeColorState(Button const& button,VisualStateGroup const& group,Storyboard const& storyboard,std::vector<NativeStateRefresh>& refresh) {
 if(!ReviewedColorStoryboard(storyboard))return false;
 if(storyboard.GetCurrentState()!=ClockState::Stopped) {
  if(auto state=group.CurrentState();state&&KnownState(state.Name())) {
   bool found=false;for(auto const& prior:refresh)if(Identity(prior.group,group)){found=true;break;}
   if(!found)refresh.push_back({make_weak(button),group,state.Name()});
  }
 }
 return EnsureStoppedClock([&]{return storyboard.GetCurrentState();},[&]{storyboard.Stop();});
}
static bool RefreshNativeColorStates(std::vector<NativeStateRefresh>& refresh) noexcept {
 bool restored=true;
 for(auto const& entry:refresh)try {
  if(auto button=entry.button.get()) {
   auto current=entry.group.CurrentState();
   // Preserve an application state transition during a reentrant callback.
   if(!current||current.Name()!=entry.state)continue;
   restored=VisualStateManager::GoToState(button,L"Normal",false)&&restored;
   restored=VisualStateManager::GoToState(button,entry.state,false)&&restored;
  }
 }catch(...){restored=false;}
 refresh.clear();return restored;
}

struct AnimationChange {weak_ref<Button> button;ObjectAnimationUsingKeyFrames animation{nullptr};Storyboard storyboard{nullptr};VisualStateGroup group{nullptr};OwnedAnimationFrame frame;};
[[clang::no_destroy]] static std::deque<AnimationChange> animationsChanged;

static bool RestoreAnimations(std::vector<NativeStateRefresh>& refresh) noexcept {

 bool restored=true;
 for(auto const& entry:animationsChanged)try {
  if(auto button=entry.button.get())restored=StopNativeColorState(button,entry.group,entry.storyboard,refresh)&&restored;
  else restored=EnsureStoppedClock([&]{return entry.storyboard.GetCurrentState();},[&]{entry.storyboard.Stop();})&&restored;
 }catch(...){restored=false;}
 if(!restored)return false;
 for(auto& entry:animationsChanged) {
  if(auto animation=entry.animation) {
   auto frames=animation.KeyFrames();
   restored=RestoreStoppedAnimationFrame(entry.frame,[&]{return AnimationFrameValue{frames.Size()>0,frames.Size()>0?frames.GetAt(0):nullptr};},
    [&](auto const& value){frames.SetAt(0,value.template as<ObjectKeyFrame>());},[&]{return entry.storyboard.GetCurrentState();})&&restored;
  }else entry.frame.owned=false;
 }
 if(restored)animationsChanged.clear();return restored;
}
static void ApplyAnimationPalette(DependencyObject const& object) {
 auto button=object.try_as<Button>();if(!button)return;
 auto style=button.Style();
 if(!style||style.TargetType().Name!=L"CalculatorApp.Controls.CalculatorButton, CalculatorApp, Version=11.2607.0.0, Culture=neutral, PublicKeyToken=null")return;
 bool primary=Windows::UI::Xaml::Automation::AutomationProperties::GetAutomationId(button)==L"equalButton";
 std::vector<DependencyObject> nodes{button};unsigned visited=0;
 while(!nodes.empty()&&visited++<24) {
  auto node=nodes.back();nodes.pop_back();
  if(auto element=node.try_as<FrameworkElement>())for(auto const& group:VisualStateManager::GetVisualStateGroups(element)) {
   if(group.Name()!=L"CommonStates")continue;
   std::vector<NativeStateRefresh> refresh;
   for(auto const& state:group.States()) {
    auto stateId=KnownState(state.Name());auto storyboard=state.Storyboard();if(stateId<2||!ReviewedColorStoryboard(storyboard))continue;
    bool tracked=false;for(auto const& entry:animationsChanged)if(Identity(entry.storyboard,storyboard)){tracked=true;break;}
    if(tracked)continue;
    if(!StopNativeColorState(button,group,storyboard,refresh))throw hresult_error(E_FAIL);
    for(auto const& timeline:storyboard.Children()) {
     auto animation=timeline.try_as<ObjectAnimationUsingKeyFrames>();
     if(!animation||Storyboard::GetTargetName(animation)!=L"ContentPresenter")continue;
     auto property=Storyboard::GetTargetProperty(animation);PCWSTR key=nullptr;
     if(property==L"Background")key=stateId==2?(primary?L"AccentFillColorSecondaryBrush":L"CalcButtonFillColorHoverBrush"):
      stateId==3?(primary?L"AccentFillColorTertiaryBrush":L"CalcButtonFillColorPressedBrush"):L"CalcButtonFillColorDisabledBrush";
     if(property==L"Foreground")key=stateId==2?(primary?L"TextOnAccentFillColorPrimaryBrush":L"CalcButtonTextFillColorHoverBrush"):
      stateId==3?(primary?L"TextOnAccentFillColorPrimaryBrush":L"CalcButtonTextFillColorPressedBrush"):L"CalcButtonTextFillColorDisabledBrush";
     if(property==L"BorderBrush")key=stateId==4?L"ButtonBorderBrushDisabled":L"ButtonBorderBrushPointerOver";
     auto frames=animation.KeyFrames();if(!key||frames.Size()!=1)continue;
     auto original=frames.GetAt(0).try_as<DiscreteObjectKeyFrame>();if(!original||original.KeyTime().TimeSpan.count()!=0)continue;
     bool seen=false;for(auto const& entry:animationsChanged)if(Identity(entry.animation,animation)){seen=true;break;}
     if(seen)continue;if(animationsChanged.size()>=1024)throw hresult_error(E_BOUNDS);
     // Retain the native keyframe object with its binding intact. Only the
     // one brush-valued keyframe in a reviewed native state is exchanged.
     DiscreteObjectKeyFrame applied;applied.KeyTime(original.KeyTime());applied.Value(SolidColorBrush(PaletteRule(key).color));
     animationsChanged.push_back({make_weak(button),animation,storyboard,group,{original,applied}});
     auto& entry=animationsChanged.back();
     if(!ApplyStoppedAnimationFrame(entry.frame,[&]{return AnimationFrameValue{frames.Size()==1,frames.Size()==1?frames.GetAt(0):nullptr};},
       [&](auto const& value){frames.SetAt(0,value.template as<ObjectKeyFrame>());},[&]{return storyboard.GetCurrentState();}))throw hresult_error(E_FAIL);
    }
   }
   if(!RefreshNativeColorStates(refresh))throw hresult_error(E_FAIL);
  }
  for(int i=0;i<VisualTreeHelper::GetChildrenCount(node);i++)nodes.push_back(VisualTreeHelper::GetChild(node,i));
 }
}
static void ApplyButtonStyle(DependencyObject const& object) {
 auto button=object.try_as<Button>();if(!button)return;
 auto base=button.Style();
 if(!base||base.TargetType().Name!=L"CalculatorApp.Controls.CalculatorButton, CalculatorApp, Version=11.2607.0.0, Culture=neutral, PublicKeyToken=null")return;
 for(auto const& prior:stylesChanged)if(Identity(prior.object.get(),button))return;
 auto local=LocalStyle(button);if(local.exists&&!local.value.try_as<Style>())return;
 if(stylesChanged.size()>=256)throw hresult_error(E_BOUNDS);
 bool primary=Windows::UI::Xaml::Automation::AutomationProperties::GetAutomationId(button)==L"equalButton";
 std::wstring xaml=L"<Style xmlns='http://schemas.microsoft.com/winfx/2006/xaml/presentation' xmlns:calc='using:CalculatorApp.Controls' TargetType='calc:CalculatorButton'>";
 auto setter=[&](PCWSTR name,PCWSTR key){xaml+=L"<Setter Property='";xaml+=name;xaml+=L"' Value='";xaml+=PaletteHex(key);xaml+=L"'/>";};
 setter(L"Background",primary?L"AccentFillColorDefaultBrush":L"CalcButtonFillColorDefaultBrush");
 setter(L"Foreground",primary?L"TextOnAccentFillColorPrimaryBrush":L"CalcButtonTextFillColorDefaultBrush");
 setter(L"HoverBackground",primary?L"AccentFillColorSecondaryBrush":L"CalcButtonFillColorHoverBrush");
 setter(L"HoverForeground",primary?L"TextOnAccentFillColorPrimaryBrush":L"CalcButtonTextFillColorHoverBrush");
 setter(L"PressBackground",primary?L"AccentFillColorTertiaryBrush":L"CalcButtonFillColorPressedBrush");
 setter(L"PressForeground",primary?L"TextOnAccentFillColorPrimaryBrush":L"CalcButtonTextFillColorPressedBrush");
 setter(L"DisabledBackground",L"CalcButtonFillColorDisabledBrush");
 setter(L"DisabledForeground",L"CalcButtonTextFillColorDisabledBrush");
 xaml+=L"</Style>";
 // XAML constructs the managed custom-property values. Retain the app's
 // original style/template, commands, layout and native visual-state groups.
 auto applied=Windows::UI::Xaml::Markup::XamlReader::Load(xaml).as<Style>();
 applied.BasedOn(base);
 stylesChanged.push_back({make_weak(button.as<FrameworkElement>()),{L"Style",nullptr,applied}});
 auto& entry=stylesChanged.back();
 if(!ApplyControlKey(entry.value,[&]{return LocalStyle(button);},
    [&](auto const& value){button.SetValue(FrameworkElement::StyleProperty(),value);}))throw hresult_error(E_FAIL);
}
static bool RestoreButtonStyles() noexcept {
 bool restored=true;
 for(auto& entry:stylesChanged) {
  if(auto object=entry.object.get())restored=RestoreControlKey(entry.value,[&]{return LocalStyle(object);},
   [&](auto const& value){object.SetValue(FrameworkElement::StyleProperty(),value);},
   [&]{object.ClearValue(FrameworkElement::StyleProperty());})&&restored;
  else entry.value.owned=false;
 }
 if(restored)stylesChanged.clear();return restored;
}

static void ApplyFocusBrush(DependencyObject const& object,DependencyProperty const& property,PCWSTR key) {
 for(auto const& prior:visualsChanged)if(prior.property==property&&Identity(prior.object.get(),object))return;
 auto local=object.ReadLocalValue(property);
 if(local&&!Identity(local,DependencyProperty::UnsetValue())&&!local.try_as<Brush>())return;
 SolidColorBrush applied(PaletteRule(key).color);
 visualsChanged.push_back({make_weak(object),property,local,applied});
 object.SetValue(property,applied);
}
static void BridgeStaticText(DependencyObject const& object) {
 auto set=[&](DependencyProperty const& property,PropertyKind kind) {
  for(auto const& prior:visualsChanged)if(prior.property==property&&Identity(prior.object.get(),object))return;
  auto local=object.ReadLocalValue(property);
  if(local&&!Identity(local,DependencyProperty::UnsetValue())&&!local.try_as<Brush>())return;
  auto current=object.GetValue(property).try_as<Brush>();if(!current)return;
  Rule const* matched=nullptr;
  for(auto const& resource:resourcesChanged)if(Matches(*resource.rule,kind))for(auto const& alias:resource.aliases)if(Identity(alias,current)) {
   if(matched&&!Same(matched->color,resource.rule->color))return;matched=resource.rule;
  }
  if(!matched)return;
  SolidColorBrush applied(matched->color);visualsChanged.push_back({make_weak(object),property,local,applied});
  object.SetValue(property,applied);
 };

 if(object.try_as<Control>()) {
  ApplyFocusBrush(object,FrameworkElement::FocusVisualPrimaryBrushProperty(),L"SystemControlFocusVisualPrimaryBrush");
  ApplyFocusBrush(object,FrameworkElement::FocusVisualSecondaryBrushProperty(),L"SystemControlFocusVisualSecondaryBrush");
 }
 // Only stable textual leaves; template backgrounds stay state-driven.
 if(object.try_as<TextBlock>())set(TextBlock::ForegroundProperty(),PropertyKind::Foreground);
 if(object.try_as<IconElement>())set(IconElement::ForegroundProperty(),PropertyKind::Foreground);
}

static void PruneRetiredControls() {
 for(auto it=animationsChanged.begin();it!=animationsChanged.end();) {
  if(!it->button.get()) {
   if(auto animation=it->animation) {
    if(!EnsureStoppedClock([&]{return it->storyboard.GetCurrentState();},[&]{it->storyboard.Stop();}))throw hresult_error(E_FAIL);
    auto frames=animation.KeyFrames();
    if(!RestoreAnimationFrame(it->frame,[&]{return AnimationFrameValue{frames.Size()>0,frames.Size()>0?frames.GetAt(0):nullptr};},
     [&](auto const& value){frames.SetAt(0,value.template as<ObjectKeyFrame>());}))throw hresult_error(E_FAIL);
   }
   it=animationsChanged.erase(it);
  }else ++it;
 }

 for(auto it=controlsChanged.begin();it!=controlsChanged.end();) {
  if(!it->element.get()) {
   if(!RestoreControlResources(*it))throw hresult_error(E_FAIL);
   it=controlsChanged.erase(it);
  }else ++it;
 }
 for(auto it=stylesChanged.begin();it!=stylesChanged.end();) {
  if(!it->object.get())it=stylesChanged.erase(it);else ++it;
 }
}
static void BridgeViews() {
    PruneRetiredControls();
    std::vector<DependencyObject> stack{observedRoot};
    for(auto popup:VisualTreeHelper::GetOpenPopups(Window::Current()))if(popup.Child())stack.push_back(popup.Child());
    unsigned count=0;
    while(!stack.empty() && count++<4096) {
        auto object=stack.back();stack.pop_back();
        RefreshControlResources(object);
        ApplyButtonStyle(object);
        ApplyAnimationPalette(object);
        BridgeStaticText(object);
        for(int i=0;i<VisualTreeHelper::GetChildrenCount(object);i++)stack.push_back(VisualTreeHelper::GetChild(object,i));
    }
    for(auto it=visualsChanged.begin();it!=visualsChanged.end();) {
        if(!it->object.get())it=visualsChanged.erase(it);else ++it;
    }
}
static bool RestorePalette() noexcept {
    admitted=false;
    std::vector<NativeStateRefresh> restartStates;
    bool restored=RestoreAnimations(restartStates);
    // A failed clock stop must not be followed by a template/style mutation.
    // Restart clocks already stopped and retain all ownership for cleanup retry.
    if(!restored){RefreshNativeColorStates(restartStates);return false;}
    restored=RestoreButtonStyles()&&restored;
    for(auto& entry:controlsChanged)restored=RestoreControlResources(entry)&&restored;
    if(applicationResources && ownedOverrides)try {
        auto merged=applicationResources.MergedDictionaries();unsigned index=0;
        if(merged.IndexOf(ownedOverrides,index))merged.RemoveAt(index);
    }catch(...){restored=false;}
    if(restored){ownedOverrides=nullptr;applicationResources=nullptr;}
    for(auto it=visualsChanged.rbegin();it!=visualsChanged.rend();++it)try {
        if(auto object=it->object.get();object && Identity(object.GetValue(it->property),it->applied)) {
            if(!it->before || Identity(it->before,DependencyProperty::UnsetValue()))object.ClearValue(it->property);
            else object.SetValue(it->property,it->before);
        }
    }catch(...){restored=false;}
    for(auto& entry:controlsChanged){entry.refresh.complete=false;restored=RefreshThemeSource(entry.refresh)&&restored;}
    if(!RestorePage())restored=false;
    restored=RefreshNativeColorStates(restartStates)&&restored;
    if(restored){controlsChanged.clear();std::vector<VisualChange>{}.swap(visualsChanged);std::vector<ResourceChange>{}.swap(resourcesChanged);}
    else Wh_Log(L"Calculator restoration incomplete; retaining baseline for retry");
    return restored;
}
static bool ApplyPalette() {
    if(!enabled.load() || HighContrast() || admitted.load())return false;
    if(!resourcesChanged.empty()||!visualsChanged.empty()||ownedOverrides||page) {
        RestorePalette();
        if(!resourcesChanged.empty()||!visualsChanged.empty()||ownedOverrides||page)return false;
    }
    try {
        auto app=Application::Current();if(!app || !observedRoot || !CurrentPage())return false;
        auto resources=app.Resources();
        auto dict=resources.ThemeDictionaries().TryLookup(box_value(L"Default")).try_as<ResourceDictionary>();
        if(!dict)return false;
        for(auto key:{L"CalcButtonFillColorDefaultBrush",L"CalcButtonAltFillColorDefaultBrush",
            L"CalcButtonTextFillColorDefaultBrush",L"AppControlPageTextBaseHighColorBrush"})
            if(!dict.TryLookup(box_value(key)).try_as<SolidColorBrush>())return false;
        std::vector<Brush> dataBrushes;
        for(auto theme:{L"Default",L"Light",L"HighContrast"}) {
            auto themed=resources.ThemeDictionaries().TryLookup(box_value(theme)).try_as<ResourceDictionary>();
            if(!themed)continue;
            for(unsigned i=1;i<=14;i++) {
                auto key=L"EquationBrush"+std::to_wstring(i);
                if(auto brush=themed.TryLookup(box_value(key)).try_as<Brush>())dataBrushes.push_back(brush);
            }
        }
        // Default's app-owned dictionary has no recursive resource sources.
        // TryLookup here is therefore a bounded local-membership check.
        if(dict.MergedDictionaries().Size()!=0 || dict.ThemeDictionaries().Size()!=0)return false;
        // Build all theme values off-tree. The app's live dictionaries and
        // shared framework brushes are never changed.
        std::vector<ResourceChange> pending;
        ResourceDictionary overrides,normal,dark;
        auto dictionaries=AliasDictionaries(resources);
        for(auto const& rule:rules) {
            auto before=dict.TryLookup(box_value(rule.key));
            if(!before)before=resources.TryLookup(box_value(rule.key));
            auto brush=before.try_as<Brush>();if(!brush)continue;
            for(auto const& data:dataBrushes)if(Identity(data,brush))return false;
            std::vector<Brush> aliases{brush};
            for(auto const& dictionary:dictionaries) {
                auto alias=dictionary.TryLookup(box_value(rule.key)).try_as<Brush>();if(!alias)continue;
                bool data=false;for(auto const& series:dataBrushes)if(Identity(series,alias)){data=true;break;}
                if(!data)aliases.push_back(alias);
            }
            SolidColorBrush applied(rule.color);
            normal.Insert(box_value(rule.key),applied);dark.Insert(box_value(rule.key),applied);
            pending.push_back({normal,rule.key,nullptr,applied,std::move(aliases),&rule,false});
        }
        if(pending.size()<4)return false;
        overrides.ThemeDictionaries().Insert(box_value(L"Default"),normal);
        overrides.ThemeDictionaries().Insert(box_value(L"Dark"),dark);
        resourcesChanged=std::move(pending);
        applicationResources=observedRoot.Resources();ownedOverrides=overrides;
        applicationResources.MergedDictionaries().Append(overrides);
        ApplyPage();BridgeViews();admitted=true;
        Wh_Log(L"Calculator palette admitted: %u resources",static_cast<unsigned>(resourcesChanged.size()));
        return true;
    }catch(hresult_error const& error){Wh_Log(L"Calculator resource admission failed: %08X",static_cast<unsigned>(error.code().value));}
    catch(...){}
    RestorePalette();return false;
}
static void OnLayout() noexcept {
    if(busy)return;
    busy=true;
    try {
        if(!enabled.load() || HighContrast()) {if(admitted.load()||!resourcesChanged.empty()||!visualsChanged.empty()||ownedOverrides||page)RestorePalette();}
        else if(admitted.load()) {ApplyPage();BridgeViews();}
        else if(admissionAttempts++<20)ApplyPalette();
    }catch(...){RestorePalette();}
    busy=false;
}
static std::atomic<bool> cleanupPinned{false};
static void RetainCleanupCode() noexcept {
    if(!cleanupPinned.exchange(true)){
        HMODULE module=nullptr;
        GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS,
            reinterpret_cast<LPCWSTR>(RetainCleanupCode),&module);
    }
}
static void Detach() noexcept {
    busy=true;
    if(observedRoot)try {observedRoot.LayoutUpdated(layoutToken);}catch(...){}
    if(observedWindow)try {observedWindow.Closed(closedToken);}catch(...){}
    layoutToken={};closedToken={};
    if(!RestorePalette()){RetainCleanupCode();coreWindow=nullptr;busy=false;return;}
    observedRoot=nullptr;admissionAttempts=0;
    observedWindow=nullptr;closedToken={};
    coreWindow=nullptr;busy=false;
}
static bool IsCoreWindow(HWND window) {
    DWORD process=0;wchar_t name[64]{};
    return window && GetWindowThreadProcessId(window,&process) && process==GetCurrentProcessId()
        && GetClassNameW(window,name,64) && _wcsicmp(name,L"Windows.UI.Core.CoreWindow")==0;
}
static void Initialize(HWND window) noexcept {
    if(!IsCoreWindow(window) || busy || (coreWindow && coreWindow!=window))return;
    busy=true;
    try {
        auto current=Window::Current();auto root=current?current.Content().try_as<FrameworkElement>():nullptr;
        if(root) {
            coreWindow=window;
            if(!observedRoot) {
                observedRoot=root;
                layoutToken=root.LayoutUpdated([](IInspectable const&,IInspectable const&){OnLayout();});
                observedWindow=current;
                closedToken=current.Closed([](auto const&,auto const&){Detach();});
            }
            if(enabled.load() && !HighContrast() && admissionAttempts++<20)ApplyPalette();
        }
    }catch(...){}
    busy=false;
}
static LRESULT WINAPI DefWindowProcHook(HWND window,UINT message,WPARAM wParam,LPARAM lParam) {
    auto result=originalDefWindowProc(window,message,wParam,lParam);
    if(window==coreWindow) {
        if(message==WM_SETTINGCHANGE || message==WM_THEMECHANGED)OnLayout();
        if(message==WM_NCDESTROY)Detach();
    }
    return result;
}
// Every cross-thread dispatch is synchronous; its hook is removed before returning.
static LRESULT CALLBACK DispatchHook(int code,WPARAM wParam,LPARAM lParam) {
    if(code==HC_ACTION) {
        auto message=reinterpret_cast<CWPSTRUCT*>(lParam);
        if(message->message==dispatchMessage && message->lParam==0 && message->wParam<=1 && IsCoreWindow(message->hwnd)) {
            if(message->wParam==1)Detach();else Initialize(message->hwnd);
        }
    }
    return CallNextHookEx(nullptr,code,wParam,lParam);
}
static void DispatchTo(HWND window,bool cleanup) {
    DWORD thread=GetWindowThreadProcessId(window,nullptr);if(!thread)return;
    if(thread==GetCurrentThreadId()) {if(cleanup)Detach();else Initialize(window);return;}
    HHOOK hook=SetWindowsHookExW(WH_CALLWNDPROC,DispatchHook,nullptr,thread);if(!hook)return;
    SendMessageW(window,dispatchMessage,cleanup?1:0,0);
    UnhookWindowsHookEx(hook);
}
static HWND FindCoreWindow() {
    HWND found=nullptr;
    EnumWindows([](HWND parent,LPARAM parameter)->BOOL {
        auto found=reinterpret_cast<HWND*>(parameter);
        if(IsCoreWindow(parent)){*found=parent;return FALSE;}
        EnumChildWindows(parent,[](HWND child,LPARAM parameter)->BOOL {
            if(IsCoreWindow(child)){*reinterpret_cast<HWND*>(parameter)=child;return FALSE;}return TRUE;
        },parameter);
        return !*found;
    },reinterpret_cast<LPARAM>(&found));
    return found;
}
static void StopDiscovery() {
    if(discoveryStop)SetEvent(discoveryStop);
    if(discovery){WaitForSingleObject(discovery,INFINITE);CloseHandle(discovery);discovery=nullptr;}
    if(discoveryStop){CloseHandle(discoveryStop);discoveryStop=nullptr;}
}
static void StartDiscovery() {
    StopDiscovery();if(!enabled.load())return;
    discoveryStop=CreateEventW(nullptr,TRUE,FALSE,nullptr);if(!discoveryStop)return;
    discovery=CreateThread(nullptr,0,[](LPVOID)->DWORD {
        try {
            // Injection can precede the CoreWindow and its XAML tree. Discovery is
            // bounded and joined before unload; it never queues a XAML callback.
            for(unsigned i=0;i<100 && enabled.load() && !admitted.load();i++) {
                if(WaitForSingleObject(discoveryStop,100)!=WAIT_TIMEOUT)return 0;
                if(auto window=FindCoreWindow())DispatchTo(window,false);
            }
        }catch(...){}
        return 0;
    },nullptr,0,nullptr);
    if(!discovery){CloseHandle(discoveryStop);discoveryStop=nullptr;}
}
BOOL Wh_ModInit() {
    if(!ReviewedPackage())return FALSE;
    dispatchMessage=RegisterWindowMessageW(L"j3w1-calculator-resource-dispatch");if(!dispatchMessage)return FALSE;
    if(!Wh_SetFunctionHook(reinterpret_cast<void*>(DefWindowProcW),reinterpret_cast<void*>(DefWindowProcHook),
        reinterpret_cast<void**>(&originalDefWindowProc)))return FALSE;
    enabled=Wh_GetIntSetting(L"enabled")!=0;return TRUE;
}
void Wh_ModAfterInit(){if(auto window=FindCoreWindow())DispatchTo(window,false);StartDiscovery();}
void Wh_ModUninit(){enabled=false;StopDiscovery();if(auto window=FindCoreWindow())DispatchTo(window,true);}
void Wh_ModSettingsChanged(){
    enabled=false;StopDiscovery();if(auto window=FindCoreWindow())DispatchTo(window,true);
    enabled=Wh_GetIntSetting(L"enabled")!=0;
    if(enabled.load()){if(auto window=FindCoreWindow())DispatchTo(window,false);StartDiscovery();}
}
