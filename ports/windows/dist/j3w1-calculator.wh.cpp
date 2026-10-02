// ==WindhawkMod==
// @id j3w1-calculator
// @name j3w1 Calculator resources
// @description Version-checked Calculator UI resources; equation colors remain native
// @version 1.3.3
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
#undef GetCurrentTime
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>
#include <winrt/Windows.UI.Xaml.h>
#include <winrt/Windows.UI.Xaml.Controls.h>
#include <winrt/Windows.UI.Xaml.Controls.Primitives.h>
#include <winrt/Windows.UI.Xaml.Markup.h>
#include <winrt/Windows.UI.Xaml.Media.h>
#include <winrt/Windows.UI.Xaml.Shapes.h>
#include <winrt/Windows.UI.ViewManagement.h>
#include <vector>
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
static void BridgeViews() {
    auto apply=[](DependencyObject const& object,DependencyProperty const& property,PropertyKind kind) {
        auto focus=kind==PropertyKind::FocusPrimary || kind==PropertyKind::FocusSecondary;
        auto brush=object.GetValue(property).try_as<Brush>();
        if(!brush && !focus)return;
        auto local=object.ReadLocalValue(property);
        if(local && !Identity(local,DependencyProperty::UnsetValue()) && !local.try_as<Brush>())return;
        for(auto const& resource:resourcesChanged)if(Identity(brush,resource.applied))return;
        ResourceChange const* match=nullptr;
        for(auto const& resource:resourcesChanged) {
            if(!Matches(*resource.rule,kind))continue;
            bool alias=focus;
            for(auto const& before:resource.aliases)if(Identity(brush,before)){alias=true;break;}
            if(!alias)continue;
            // Resource overrides can split aliases; a visual without its key cannot.
            if(match && !Same(match->rule->color,resource.rule->color))return;
            match=&resource;
        }
        if(!match)return;
        // Record before mutation, so a failed setter cannot escape restoration.
        bool updated=false;
        for(auto& prior:visualsChanged)if(Identity(prior.object.get(),object)&&Identity(prior.property,property)) {
            prior.before=local;prior.applied=match->applied;updated=true;break;
        }
        if(!updated)visualsChanged.push_back({make_weak(object),property,local,match->applied});
        object.SetValue(property,match->applied);
    };
    std::vector<DependencyObject> stack{observedRoot};
    for(auto popup:VisualTreeHelper::GetOpenPopups(Window::Current()))if(popup.Child())stack.push_back(popup.Child());
    unsigned count=0;
    while(!stack.empty() && count++<4096) {
        auto object=stack.back();stack.pop_back();
        if(object.try_as<SplitView>()) {
            apply(object,SplitView::PaneBackgroundProperty(),PropertyKind::Background);
        }
        if(object.try_as<Control>()) {
            apply(object,Control::BackgroundProperty(),PropertyKind::Background);
            apply(object,Control::ForegroundProperty(),PropertyKind::Foreground);
            apply(object,Control::BorderBrushProperty(),PropertyKind::Border);
        }
        if(object.try_as<ContentPresenter>()) {
            apply(object,ContentPresenter::BackgroundProperty(),PropertyKind::Background);
            apply(object,ContentPresenter::ForegroundProperty(),PropertyKind::Foreground);
            apply(object,ContentPresenter::BorderBrushProperty(),PropertyKind::Border);
        }
        if(object.try_as<Border>()) {
            apply(object,Border::BackgroundProperty(),PropertyKind::Background);
            apply(object,Border::BorderBrushProperty(),PropertyKind::Border);
        }
        if(object.try_as<Panel>())apply(object,Panel::BackgroundProperty(),PropertyKind::Background);
        if(object.try_as<TextBlock>())apply(object,TextBlock::ForegroundProperty(),PropertyKind::Foreground);
        if(object.try_as<IconElement>())apply(object,IconElement::ForegroundProperty(),PropertyKind::Foreground);
        if(object.try_as<Windows::UI::Xaml::Shapes::Shape>()) {
            apply(object,Windows::UI::Xaml::Shapes::Shape::FillProperty(),PropertyKind::Background);
            apply(object,Windows::UI::Xaml::Shapes::Shape::StrokeProperty(),PropertyKind::Border);
        }
        if(object.try_as<FrameworkElement>()) {
            apply(object,FrameworkElement::FocusVisualPrimaryBrushProperty(),PropertyKind::FocusPrimary);
            apply(object,FrameworkElement::FocusVisualSecondaryBrushProperty(),PropertyKind::FocusSecondary);
        }
        for(int i=0;i<VisualTreeHelper::GetChildrenCount(object);i++)stack.push_back(VisualTreeHelper::GetChild(object,i));
    }
    for(auto it=visualsChanged.begin();it!=visualsChanged.end();) {
        if(!it->object.get())it=visualsChanged.erase(it);else ++it;
    }
}
static void RestorePalette() noexcept {
    admitted=false;
    bool restored=true;
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
    if(!RestorePage())restored=false;
    if(restored){std::vector<VisualChange>{}.swap(visualsChanged);std::vector<ResourceChange>{}.swap(resourcesChanged);}
    else Wh_Log(L"Calculator restoration incomplete; retaining baseline for retry");
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
static void Detach() noexcept {
    busy=true;
    if(observedRoot)try {observedRoot.LayoutUpdated(layoutToken);}catch(...){}
    if(observedWindow)try {observedWindow.Closed(closedToken);}catch(...){}
    RestorePalette();observedRoot=nullptr;layoutToken={};admissionAttempts=0;
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
