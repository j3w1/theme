// ==WindhawkMod==
// @id j3w1-calculator
// @name j3w1 Calculator resources
// @description Version-checked Calculator UI resources; equation colors remain native
// @version 1.4.10
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
    {L"ToolTipBackgroundBrush",{255,36,16,16},L"color.surface.overlay"},
    {L"ToolTipForegroundBrush",{255,233,148,153},L"color.text.default"},
    {L"AcrylicInAppFillColorDefaultBrush",{255,22,11,11},L"color.surface.raised"},
    {L"SystemControlTransientBorderBrush",{255,229,57,53},L"color.border.overlay"},
    {L"ToggleButtonForeground",{255,233,148,153},L"color.text.default"},
    {L"ToggleButtonBackground",{255,0,0,0},L"color.surface.canvas"},
    {L"ToggleButtonBorderBrush",{255,163,103,107},L"color.border.control"},
    {L"ToggleButtonForegroundPointerOver",{255,233,148,153},L"color.text.default"},
    {L"ToggleButtonBackgroundPointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
    {L"ToggleButtonBorderBrushPointerOver",{255,229,57,53},L"color.border.active"},
    {L"ToggleButtonForegroundPressed",{255,233,148,153},L"color.text.default"},
    {L"ToggleButtonBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"ToggleButtonBorderBrushPressed",{255,229,57,53},L"color.border.active"},
    {L"ToggleButtonForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
    {L"ToggleButtonBackgroundDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"ToggleButtonBorderBrushDisabled",{255,125,19,16},L"color.border.disabled"},
    {L"ToggleButtonForegroundChecked",{255,233,148,153},L"color.text.default"},
    {L"ToggleButtonBackgroundChecked",{255,83,19,16},L"color.interaction.selection.bg"},
    {L"ToggleButtonBorderBrushChecked",{255,229,57,53},L"color.border.active"},
    {L"ToggleButtonForegroundCheckedPointerOver",{255,233,148,153},L"color.text.default"},
    {L"ToggleButtonBackgroundCheckedPointerOver",{255,83,19,16},L"color.interaction.selection.bg"},
    {L"ToggleButtonBorderBrushCheckedPointerOver",{255,229,57,53},L"color.border.active"},
    {L"ToggleButtonForegroundCheckedPressed",{255,233,148,153},L"color.text.default"},
    {L"ToggleButtonBackgroundCheckedPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"ToggleButtonBorderBrushCheckedPressed",{255,229,57,53},L"color.border.active"},
    {L"ToggleButtonForegroundCheckedDisabled",{255,138,85,89},L"color.text.disabled"},
    {L"ToggleButtonBackgroundCheckedDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"ToggleButtonBorderBrushCheckedDisabled",{255,125,19,16},L"color.border.disabled"},
    {L"ToggleButtonForegroundIndeterminate",{255,233,148,153},L"color.text.default"},
    {L"ToggleButtonBackgroundIndeterminate",{255,0,0,0},L"color.surface.canvas"},
    {L"ToggleButtonBorderBrushIndeterminate",{255,163,103,107},L"color.border.control"},
    {L"ToggleButtonForegroundIndeterminatePointerOver",{255,233,148,153},L"color.text.default"},
    {L"ToggleButtonBackgroundIndeterminatePointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
    {L"ToggleButtonBorderBrushIndeterminatePointerOver",{255,229,57,53},L"color.border.active"},
    {L"ToggleButtonForegroundIndeterminatePressed",{255,233,148,153},L"color.text.default"},
    {L"ToggleButtonBackgroundIndeterminatePressed",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"ToggleButtonBorderBrushIndeterminatePressed",{255,229,57,53},L"color.border.active"},
    {L"ToggleButtonForegroundIndeterminateDisabled",{255,138,85,89},L"color.text.disabled"},
    {L"ToggleButtonBackgroundIndeterminateDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"ToggleButtonBorderBrushIndeterminateDisabled",{255,125,19,16},L"color.border.disabled"},
    {L"ButtonBackgroundDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"SubtleButtonBackground",{255,0,0,0},L"color.surface.canvas"},
    {L"SubtleButtonForeground",{255,233,148,153},L"color.text.default"},
    {L"SubtleButtonBorderBrush",{255,163,103,107},L"color.border.control"},
    {L"SubtleButtonBackgroundPointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
    {L"SubtleButtonForegroundPointerOver",{255,233,148,153},L"color.text.default"},
    {L"SubtleButtonBorderBrushPointerOver",{255,229,57,53},L"color.border.active"},
    {L"SubtleButtonBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"SubtleButtonForegroundPressed",{255,233,148,153},L"color.text.default"},
    {L"SubtleButtonBorderBrushPressed",{255,229,57,53},L"color.border.active"},
    {L"SubtleButtonBackgroundDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"SubtleButtonForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
    {L"SubtleButtonBorderBrushDisabled",{255,125,19,16},L"color.border.disabled"},
    {L"SplitButtonBackground",{255,0,0,0},L"color.surface.canvas"},
    {L"SplitButtonForeground",{255,233,148,153},L"color.text.default"},
    {L"SplitButtonBorderBrush",{255,163,103,107},L"color.border.control"},
    {L"SplitButtonBackgroundPointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
    {L"SplitButtonForegroundPointerOver",{255,233,148,153},L"color.text.default"},
    {L"SplitButtonBorderBrushPointerOver",{255,229,57,53},L"color.border.active"},
    {L"SplitButtonBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"SplitButtonForegroundPressed",{255,233,148,153},L"color.text.default"},
    {L"SplitButtonBorderBrushPressed",{255,229,57,53},L"color.border.active"},
    {L"SplitButtonBackgroundDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"SplitButtonForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
    {L"SplitButtonBorderBrushDisabled",{255,125,19,16},L"color.border.disabled"},
    {L"SplitButtonBackgroundChecked",{255,83,19,16},L"color.interaction.selection.bg"},
    {L"SplitButtonForegroundChecked",{255,244,238,238},L"color.interaction.selection.text"},
    {L"SplitButtonBorderBrushChecked",{255,229,57,53},L"color.border.active"},
    {L"SplitButtonBackgroundCheckedPointerOver",{255,83,19,16},L"color.interaction.selection.bg"},
    {L"SplitButtonForegroundCheckedPointerOver",{255,244,238,238},L"color.interaction.selection.text"},
    {L"SplitButtonBorderBrushCheckedPointerOver",{255,229,57,53},L"color.border.active"},
    {L"SplitButtonBackgroundCheckedPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"SplitButtonForegroundCheckedPressed",{255,233,148,153},L"color.text.default"},
    {L"SplitButtonBorderBrushCheckedPressed",{255,229,57,53},L"color.border.active"},
    {L"SplitButtonBackgroundCheckedDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
    {L"SplitButtonForegroundCheckedDisabled",{255,138,85,89},L"color.text.disabled"},
    {L"SplitButtonBorderBrushCheckedDisabled",{255,125,19,16},L"color.border.disabled"},
    {L"SplitButtonForegroundSecondary",{255,189,120,125},L"color.text.muted"},
    {L"SplitButtonForegroundSecondaryPressed",{255,189,120,125},L"color.text.muted"},
    {L"SplitButtonBorderBrushDivider",{255,43,14,13},L"color.border.divider"},
    {L"SplitButtonBorderBrushCheckedDivider",{255,43,14,13},L"color.border.divider"},
    {L"SplitButtonInAppBarUnfocusedPointerOver",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"DropDownButtonForegroundSecondary",{255,189,120,125},L"color.text.muted"},
    {L"DropDownButtonForegroundSecondaryPointerOver",{255,189,120,125},L"color.text.muted"},
    {L"DropDownButtonForegroundSecondaryPressed",{255,189,120,125},L"color.text.muted"},
    {L"ButtonBackground",{255,0,0,0},L"color.surface.input"},
    {L"ButtonBackgroundPointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
    {L"ButtonBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
    {L"ButtonForeground",{255,233,148,153},L"color.text.default"},
    {L"ButtonForegroundPointerOver",{255,233,148,153},L"color.text.default"},
    {L"ButtonForegroundPressed",{255,233,148,153},L"color.text.default"},
    {L"ButtonForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
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
static bool CompositeButtonChrome(std::wstring_view type) {
 return type==L"Microsoft.UI.Xaml.Controls.SplitButton";
}
static bool ChromeControl(DependencyObject const& object) {
    auto type=get_class_name(object);
    // Pane ThemeResources resolve at NavigationView, above its row controls.
    if(type==L"Microsoft.UI.Xaml.Controls.NavigationView"
        ||type==L"Microsoft.UI.Xaml.Controls.NavigationViewItemHeader"
        ||type==L"Microsoft.UI.Xaml.Controls.NavigationViewItem"
        ||type==L"Microsoft.UI.Xaml.Controls.Primitives.NavigationViewItemPresenter")return true;
    return CompositeButtonChrome(std::wstring_view{type})
        ||object.try_as<Windows::UI::Xaml::Controls::Primitives::ButtonBase>()
        ||object.try_as<MenuFlyoutPresenter>()||object.try_as<MenuFlyoutItem>()||object.try_as<MenuFlyoutSubItem>()
        ||object.try_as<ToggleSwitch>()||object.try_as<ComboBox>()||object.try_as<ListViewItem>()
        ||object.try_as<TextBlock>()||object.try_as<IconElement>()
        // WinUI popup resources resolve at the host, above its buttons/text.
        ||object.try_as<ToolTip>()||object.try_as<CommandBar>()||object.try_as<FlyoutPresenter>();
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


using ProjectedObject=IInspectable;
// Native templates can retain a resolved brush inside a zero-time object
// keyframe. Local ThemeResource overrides do not replace that cached value.
// Exchange only the observed color-only storyboard shape, with its clock
// stopped; retain original keyframe objects and their expressions for rollback.
using namespace Windows::UI::Xaml::Media::Animation;
struct ChromeFrameValue {bool exists=false;ProjectedObject value{nullptr};};
struct OwnedChromeFrame {ProjectedObject original{nullptr},applied{nullptr};bool owned=false;};
template<class Read,class Write,class Clock> static bool UpdateChromeFrame(OwnedChromeFrame& entry,bool active,Read read,Write write,Clock clock) noexcept {
 try {
  if(clock()!=ClockState::Stopped)return false;
  auto current=read();
  if(active) {
   if(entry.owned)return true;
   if(!current.exists||!Identity(current.value,entry.original))return false;
   entry.owned=true;write(entry.applied);
  } else if(entry.owned) {
   if(current.exists&&Identity(current.value,entry.applied))write(entry.original);
   entry.owned=false;
  }
  return true;
 }catch(...){return false;}
}
static bool ChromeColorFrameAdmission(std::wstring_view target,std::wstring_view property,unsigned frames,bool brush,long long time) noexcept {
 if(frames!=1||!brush||time!=0)return false;
 if(property==L"Background"||property==L"BorderBrush")return target==L"ContentPresenter"||target==L"RootGrid";
 return property==L"Foreground"&&(target==L"ContentPresenter"||target==L"ChevronIcon");
}
static unsigned ChromeColorState(std::wstring_view state) noexcept {
 if(state==L"Normal")return 1;if(state==L"PointerOver")return 2;
 if(state==L"Pressed")return 3;if(state==L"Disabled")return 4;return 0;
}
// Native deferred setters/keyframes can reject their public getter until the
// state resolves. A failed inspection admits nothing and must not unwind an
// otherwise owned resource root. Only inspection belongs in this boundary;
// writes, state transitions and recovery keep their existing failure paths.
template<class Inspect> static bool InspectChromeState(Inspect inspect) noexcept {
 try{return inspect();}catch(...){return false;}
}
static bool ChromeColorStoryboard(Storyboard const& storyboard) {
 return InspectChromeState([&] {
 if(!storyboard||!storyboard.Children().Size()||storyboard.Children().Size()>4)return false;
 unsigned seen=0;
 for(auto const& child:storyboard.Children()) {
  auto animation=child.try_as<ObjectAnimationUsingKeyFrames>();if(!animation)return false;
  auto frames=animation.KeyFrames();auto frame=frames.Size()==1?frames.GetAt(0).try_as<DiscreteObjectKeyFrame>():nullptr;
  auto target=Storyboard::GetTargetName(animation),property=Storyboard::GetTargetProperty(animation);
  if(!frame||!ChromeColorFrameAdmission(std::wstring_view{target},std::wstring_view{property},frames.Size(),bool(frame.Value().try_as<Brush>()),frame.KeyTime().TimeSpan.count()))return false;
  unsigned bit=property==L"Background"?1:property==L"BorderBrush"?2:target==L"ContentPresenter"?4:8;
  if(seen&bit)return false;seen|=bit;
 }
 return true;
 });
}
struct ChromeStateRefresh {weak_ref<Control> control;VisualStateGroup group{nullptr};hstring state,expected;};
struct ChromeAnimationChange {weak_ref<Control> control;ObjectAnimationUsingKeyFrames animation{nullptr};Storyboard storyboard{nullptr};VisualStateGroup group{nullptr};OwnedChromeFrame frame;};
struct ChromeSetterChange {weak_ref<Control> control;VisualState state{nullptr};VisualStateGroup group{nullptr};unsigned index=0;OwnedChromeFrame value;};
static bool ChromeSetterState(std::wstring_view state) noexcept {
 return ChromeColorState(state)||state==L"Selected"||state==L"Checked"||state==L"CheckedPointerOver"
  ||state==L"CheckedPressed"||state==L"CheckedDisabled"||state==L"OverflowPointerOver"||state==L"OverflowPressed";
}
static bool ChromeSetterAdmission(std::wstring_view property,bool brush,bool sealed) noexcept {
 return !sealed&&brush&&(property==L"Background"||property==L"Foreground"||property==L"BorderBrush");
}
static Color ChromeStateColor(std::wstring_view property,unsigned state,bool secondary);
// Setters and cached keyframes must use the same state ladder. Checked
// storyboards cannot fall through to a neutral native endpoint on hover exit.
static std::wstring ChromeStatePaletteKey(std::wstring_view property,std::wstring_view state,bool secondary=false) {
 if(!ChromeSetterState(state)||(property!=L"Background"&&property!=L"Foreground"&&property!=L"BorderBrush"))throw hresult_error(E_INVALIDARG);
 auto id=ChromeColorState(state);
 if(state==L"OverflowPointerOver")id=2;
 if(state==L"OverflowPressed")id=3;
 bool checked=state==L"Selected"||state==L"Checked"||state==L"CheckedPointerOver"||state==L"CheckedPressed"||state==L"CheckedDisabled";
 std::wstring key=secondary&&property==L"Foreground"?L"DropDownButtonForegroundSecondary":
  checked?(property==L"Background"?L"ToggleButtonBackground":property==L"BorderBrush"?L"ToggleButtonBorderBrush":L"ToggleButtonForeground"):
  property==L"Background"?L"ButtonBackground":property==L"BorderBrush"?L"ButtonBorderBrush":L"ButtonForeground";
 if(checked) {
  key+=L"Checked";
  if(state==L"CheckedPointerOver")key+=L"PointerOver";
  else if(state==L"CheckedPressed")key+=L"Pressed";
  else if(state==L"CheckedDisabled")key+=L"Disabled";
 }else if(id==2)key+=L"PointerOver";else if(id==3)key+=L"Pressed";
 else if(id==4)key=property==L"Background"?L"ButtonBackgroundDisabled":property==L"BorderBrush"?L"ButtonBorderBrushDisabled":L"ButtonForegroundDisabled";
 // Chevron foreground has no checked family; it keeps its own secondary role.
 if(secondary&&property==L"Foreground"&&checked)key=state==L"CheckedDisabled"?L"ButtonForegroundDisabled":state==L"CheckedPressed"?L"DropDownButtonForegroundSecondaryPressed":state==L"CheckedPointerOver"?L"DropDownButtonForegroundSecondaryPointerOver":L"DropDownButtonForegroundSecondary";
 return key;
}
static Color ChromeSetterColor(std::wstring_view property,std::wstring_view state,bool secondary=false) {
 auto key=ChromeStatePaletteKey(property,state,secondary);
 for(auto const& rule:rules)if(key==rule.key)return rule.color;
 throw hresult_error(E_INVALIDARG);
}
static bool StopChromeColorState(Control const& control,VisualStateGroup const& group,Storyboard const& storyboard,std::vector<ChromeStateRefresh>& refresh) noexcept {
 try {
  if(!ChromeColorStoryboard(storyboard))return false;
  auto clock=storyboard.GetCurrentState();if(clock==ClockState::Stopped)return true;
  if(clock!=ClockState::Active&&clock!=ClockState::Filling)return false;
  if(control)if(auto state=group.CurrentState();state&&ChromeSetterState(std::wstring_view{state.Name()})) {
   bool found=false;for(auto const& prior:refresh)if(Identity(prior.group,group)){found=true;break;}
   if(!found)refresh.push_back({make_weak(control),group,state.Name()});
  }
  storyboard.Stop();return storyboard.GetCurrentState()==ClockState::Stopped;
 }catch(...){return false;}
}
static bool RefreshChromeColorStates(std::vector<ChromeStateRefresh>& refresh) noexcept {
 bool complete=true;
 for(auto const& entry:refresh)try {
  if(auto control=entry.control.get()) {
   auto current=entry.group.CurrentState();
   if(!current||current.Name()!=(entry.expected.empty()?entry.state:entry.expected))continue;
   complete=VisualStateManager::GoToState(control,L"Normal",false)&&complete;
   complete=VisualStateManager::GoToState(control,entry.state,false)&&complete;
  }
 }catch(...){complete=false;}
 refresh.clear();return complete;
}
static Color ChromeStateColor(std::wstring_view property,unsigned state,bool secondary) {
 std::wstring key=secondary?L"DropDownButtonForegroundSecondary":property==L"Background"?L"ButtonBackground":property==L"BorderBrush"?L"ButtonBorderBrush":L"ButtonForeground";
 if(state==2)key+=L"PointerOver";else if(state==3)key+=L"Pressed";else if(state==4)key=property==L"Background"?L"ButtonBackgroundDisabled":property==L"BorderBrush"?L"ButtonBorderBrushDisabled":L"ButtonForegroundDisabled";
 for(auto const& rule:rules)if(key==rule.key)return rule.color;
 throw hresult_error(E_INVALIDARG);
}

// Transparent white is visually empty at rest, but RGB brush interpolation
// carries its white channels into an opaque hover fill. Keep the native alpha,
// hit testing and transition; use the mapped normal background's RGB instead.
static bool ChromeTransparentBaseAdmission(Color color,bool readableLocal,bool knownTemplate) noexcept {
 return readableLocal&&knownTemplate&&color.A==0&&color.R==255&&color.G==255&&color.B==255;
}
struct OwnedChromeBase {OwnedChromeFrame value;bool replaced=false;};
struct ChromeBaseChange {weak_ref<Control> control;OwnedChromeBase base;};
template<class Read,class Write> static bool UpdateChromeBase(OwnedChromeBase& entry,bool active,Read read,Write write) noexcept {
 try {
  auto current=read();
  if(entry.value.owned&&(!current.exists||!Identity(current.value,entry.value.applied))) {
   // A later application write ends ownership permanently for this control.
   entry.value.owned=false;entry.replaced=true;
  }
  if(active&&entry.replaced)return true;
  return UpdateChromeFrame(entry.value,active,read,write,[]{return ClockState::Stopped;});
 }catch(...){return false;}
}
static bool ChromeTransparentBaseStateAdmission(unsigned state,bool empty,bool colorOnly,bool background) noexcept {
 if(state==1)return empty;
 if(state==2||state==3)return colorOnly&&background;
 return state==4&&colorOnly;
}
struct OwnedChromeTransition {ProjectedObject before{nullptr},applied{nullptr};bool owned=false,replaced=false;};
struct ChromeTransitionChange {weak_ref<FrameworkElement> presenter;OwnedChromeTransition value;};
static bool ChromeBaseTransitionProof(ContentPresenter const& presenter,std::deque<ChromeTransitionChange> const& transitions);
static bool ChromeTransparentBaseTemplate(Control const& control,FrameworkElement const& element,VisualStateGroup const& group,std::deque<ChromeTransitionChange> const& transitions) {
 return InspectChromeState([&] {
  auto presenter=element.try_as<ContentPresenter>();
  if(!presenter||!Identity(VisualTreeHelper::GetParent(presenter),control)||presenter.Name()!=L"ContentPresenter"||group.Name()!=L"CommonStates"||group.States().Size()!=4)return false;
  if(!ChromeBaseTransitionProof(presenter,transitions))return false;
  unsigned seen=0;
  for(auto const& state:group.States()) {
   unsigned id=ChromeColorState(std::wstring_view{state.Name()});if(!id||seen&(1u<<id))return false;seen|=1u<<id;
   auto storyboard=state.Storyboard();
   if(id==1){if(!ChromeTransparentBaseStateAdmission(id,!state.Setters().Size()&&(!storyboard||!storyboard.Children().Size()),false,false))return false;continue;}
   // Non-background native setters are not altered. Only the known color-only
   // storyboard shape participates in this base normalization.
   if(!ChromeColorStoryboard(storyboard))return false;
   bool background=false;
   for(auto const& animation:storyboard.Children()) {
    auto target=Storyboard::GetTargetName(animation),property=Storyboard::GetTargetProperty(animation);
    if(target!=L"ContentPresenter")return false;
    if(property==L"Background")background=true;
   }
   if(!ChromeTransparentBaseStateAdmission(id,false,true,background))return false;
  }
  return seen==30;
 });
}
static bool RestoreChromeBases(std::deque<ChromeBaseChange>& entries) noexcept {
 bool complete=true;
 for(auto& entry:entries)try {
  auto control=entry.control.get();if(!control){entry.base.value.owned=false;continue;}
  auto property=Control::BackgroundProperty();
  complete=UpdateChromeBase(entry.base,false,[&]{return ChromeFrameValue{true,control.ReadLocalValue(property)};},
   [&](auto const& value){if(Identity(value,DependencyProperty::UnsetValue()))control.ClearValue(property);else control.SetValue(property,value);})&&complete;
 }catch(...){complete=false;}
 if(complete)try {
  // Keep replacement markers through high-contrast/deactivation cycles. They
  // retire with the control or this adapter lifetime, never re-adopting a
  // later application write during ordinary refresh.
  for(auto it=entries.begin();it!=entries.end();) {
   if(it->base.replaced&&it->control.get())++it;else it=entries.erase(it);
  }
 }catch(...){complete=false;}
 return complete;
}
static void ApplyChromeBase(Control const& control,FrameworkElement const& element,VisualStateGroup const& group,std::deque<ChromeBaseChange>& entries,std::deque<ChromeTransitionChange> const& transitions) {
 for(auto it=entries.begin();it!=entries.end();)if(!it->control.get())it=entries.erase(it);else ++it;
 for(auto& entry:entries)if(Identity(entry.control.get(),control)) {
  if(!UpdateChromeBase(entry.base,true,[&]{return ChromeFrameValue{true,control.ReadLocalValue(Control::BackgroundProperty())};},
   [&](auto const& value){control.SetValue(Control::BackgroundProperty(),value);}))throw hresult_error(E_FAIL);
  return;
 }
 auto property=Control::BackgroundProperty();ProjectedObject local{nullptr};SolidColorBrush brush{nullptr};
 bool admitted=InspectChromeState([&]{
  local=control.ReadLocalValue(property);brush=control.GetValue(property).try_as<SolidColorBrush>();
  bool readable=local&&(Identity(local,DependencyProperty::UnsetValue())||local.try_as<Brush>());
  return brush&&ChromeTransparentBaseAdmission(brush.Color(),readable,ChromeTransparentBaseTemplate(control,element,group,transitions));
 });
 if(!admitted)return;
 auto color=ChromeStateColor(L"Background",1,false);color.A=brush.Color().A;
 if(entries.size()>=4096)throw hresult_error(E_BOUNDS);
 entries.push_back({make_weak(control),{{local,SolidColorBrush(color)}}});auto& entry=entries.back();
 if(!UpdateChromeBase(entry.base,true,[&]{return ChromeFrameValue{true,control.ReadLocalValue(property)};},
  [&](auto const& value){control.SetValue(property,value);}))throw hresult_error(E_FAIL);
}

// Some recorded native button templates interpolate cached neutral RGB even
// after their destination brushes are themed. Replace only their cosmetic
// 83ms background transition with null. A zero-duration transition still
// creates a compositor animation and can hand off a cached neutral color.
// A null transition makes the next Background change clear that cached state.
// Retain the exact original object; never mutate a shared native transition.
static bool ChromeTransitionIdentity(ProjectedObject const& a,ProjectedObject const& b) {
 return (!a&&!b)||Identity(a,b);
}
template<class Read,class Write> static bool UpdateChromeTransition(OwnedChromeTransition& entry,bool active,Read read,Write write) noexcept {
 try {
  auto current=read();
  if(entry.owned&&!ChromeTransitionIdentity(current,entry.applied)){entry.owned=false;entry.replaced=true;}
  if(entry.replaced)return true;
  if(active) {
   if(entry.owned)return true;
   if(!ChromeTransitionIdentity(current,entry.before))return false;
   entry.owned=true;write(entry.applied);
  }else if(entry.owned){write(entry.before);entry.owned=false;}
  return true;
 }catch(...){return false;}
}
static bool ChromeTransitionAdmission(long long duration,bool ownedTemplate,bool readableLocal) noexcept {
 return ownedTemplate&&readableLocal&&duration==830000;
}
// Cached fill storyboards also paint RootGrid panels/borders. Their native
// BackgroundTransition is independent of the button's ContentPresenter.
static bool ChromeTransitionPartAdmission(std::wstring_view name,bool presenter,bool panel,bool border) noexcept {
 return (presenter&&name==L"ContentPresenter")||((panel||border)&&name==L"RootGrid");
}
static BrushTransition ChromeBackgroundTransition(FrameworkElement const& element) {
 if(auto presenter=element.try_as<ContentPresenter>())return presenter.BackgroundTransition();
 if(auto panel=element.try_as<Panel>())return panel.BackgroundTransition();
 if(auto border=element.try_as<Border>())return border.BackgroundTransition();
 throw hresult_error(E_INVALIDARG);
}
static void ChromeBackgroundTransition(FrameworkElement const& element,ProjectedObject const& value) {
 BrushTransition transition=value?value.as<BrushTransition>():nullptr;
 if(auto presenter=element.try_as<ContentPresenter>()){presenter.BackgroundTransition(transition);return;}
 if(auto panel=element.try_as<Panel>()){panel.BackgroundTransition(transition);return;}
 if(auto border=element.try_as<Border>()){border.BackgroundTransition(transition);return;}
 throw hresult_error(E_INVALIDARG);
}
// Transition removal runs before template-base normalization. The retained
// original establishes the same 83ms contract after our owned removal.
// A null transition without an active exact-presenter receipt grants no admission.
static bool ChromeBaseCapturedTransitionAdmission(bool absent,long long before,bool sameTarget,bool sameApplied,bool owned,bool replaced) noexcept {
 return absent&&before==830000&&sameTarget&&sameApplied&&owned&&!replaced;
}
static bool ChromeBaseTransitionProof(ContentPresenter const& presenter,std::deque<ChromeTransitionChange> const& transitions) {
 auto current=presenter.BackgroundTransition();
 for(auto const& entry:transitions) {
  if(!Identity(entry.presenter.get(),presenter))continue;
  // Check ownership/identity before reading the saved native object. Once a
  // presenter has a receipt, a later native-looking duration cannot bypass it.
  if(!entry.value.owned||entry.value.replaced||!ChromeTransitionIdentity(current,entry.value.applied))return false;
  auto before=entry.value.before.try_as<BrushTransition>();if(!before)return false;
  return ChromeBaseCapturedTransitionAdmission(!current,before.Duration().count(),true,true,entry.value.owned,entry.value.replaced);
 }
 return current&&current.Duration().count()==830000;
}
static bool RestoreChromeTransitions(std::deque<ChromeTransitionChange>& entries) noexcept {
 bool restored=true;
 for(auto& entry:entries)try {
  if(auto presenter=entry.presenter.get()) {
   restored=UpdateChromeTransition(entry.value,false,[&]{return ChromeBackgroundTransition(presenter);},
    [&](auto const& value){ChromeBackgroundTransition(presenter,value);})&&restored;
  }else entry.value.owned=false;
 }catch(...){restored=false;}
 if(restored)for(auto it=entries.begin();it!=entries.end();) {
  if(it->value.replaced&&it->presenter.get())++it;else it=entries.erase(it);
 }
 return restored;
}
static void ApplyChromeTransition(Control const& control,DependencyObject const& object,std::deque<ChromeTransitionChange>& entries) {
 auto presenter=object.try_as<FrameworkElement>();
 if(!presenter||!presenter.IsLoaded()||!ChromeTransitionPartAdmission(std::wstring_view{presenter.Name()},bool(object.try_as<ContentPresenter>()),bool(object.try_as<Panel>()),bool(object.try_as<Border>())))return;
 for(auto it=entries.begin();it!=entries.end();)if(!it->presenter.get())it=entries.erase(it);else ++it;
 for(auto& entry:entries)if(Identity(entry.presenter.get(),presenter)) {
  if(!UpdateChromeTransition(entry.value,true,[&]{return ChromeBackgroundTransition(presenter);},[&](auto const& value){ChromeBackgroundTransition(presenter,value);}))throw hresult_error(E_FAIL);
  return;
 }
 ProjectedObject local{nullptr};bool admitted=InspectChromeState([&] {
  auto parent=VisualTreeHelper::GetParent(presenter);bool owned=false;
  for(unsigned depth=0;parent&&depth<16;depth++,parent=VisualTreeHelper::GetParent(parent)) {
   if(parent.try_as<Control>()){owned=Identity(parent,control);break;}
  }
  auto transition=ChromeBackgroundTransition(presenter);if(!transition)return false;
  local=transition;
  return ChromeTransitionAdmission(transition.Duration().count(),owned,bool(local));
 });
 if(!admitted)return;
 if(entries.size()>=4096)throw hresult_error(E_BOUNDS);
 entries.push_back({make_weak(presenter),{local,nullptr}});auto& entry=entries.back();
 if(!UpdateChromeTransition(entry.value,true,[&]{return ChromeBackgroundTransition(presenter);},[&](auto const& value){ChromeBackgroundTransition(presenter,value);}))throw hresult_error(E_FAIL);
}

static bool RestoreChromeAnimations(std::deque<ChromeAnimationChange>& changes) noexcept {
 bool complete=true;std::vector<ChromeStateRefresh> refresh;
 for(auto& entry:changes)try {
  auto frames=entry.animation.KeyFrames();
  // A native replacement/deletion ends our ownership. It does not grant
  // permission to stop or replay the application's replacement storyboard.
  if(entry.frame.owned&&(frames.Size()!=1||!Identity(frames.GetAt(0),entry.frame.applied)))entry.frame.owned=false;
  if(!entry.frame.owned)continue;
  if(!StopChromeColorState(entry.control.get(),entry.group,entry.storyboard,refresh)){complete=false;continue;}
  complete=UpdateChromeFrame(entry.frame,false,[&]{return ChromeFrameValue{frames.Size()>0,frames.Size()>0?frames.GetAt(0):nullptr};},
   [&](auto const& value){frames.SetAt(0,value.template as<ObjectKeyFrame>());},[&]{return entry.storyboard.GetCurrentState();})&&complete;
 }catch(...){complete=false;}
 // Restore values before restarting native states. A failed write keeps its
 // original object for the existing UI-thread cleanup retry.
 complete=RefreshChromeColorStates(refresh)&&complete;
 if(complete)changes.clear();return complete;
}
static bool SuspendChromeSetters(Control const& control,VisualStateGroup const& group,std::vector<ChromeStateRefresh>& refresh) {
 auto state=group.CurrentState();if(!state)return true;
 if(!ChromeSetterState(std::wstring_view{state.Name()}))return false;
 for(auto const& prior:refresh)if(Identity(prior.group,group))return true;
 refresh.push_back({make_weak(control),group,state.Name(),L"Normal"});
 if(!VisualStateManager::GoToState(control,L"Normal",false))return false;
 auto current=group.CurrentState();return current&&current.Name()==L"Normal";
}
static bool SetterTargetInControl(Setter const& setter,Control const& control) {
 auto path=setter.Target();if(!path)return false;
 auto target=path.Target().try_as<DependencyObject>();if(!target)return false;
 // The public target must resolve to this control's visual subtree; unresolved
 // name-only paths and unrelated targets are refused rather than guessed.
 auto cursor=target;for(unsigned depth=0;cursor&&depth<32;depth++,cursor=VisualTreeHelper::GetParent(cursor))if(Identity(cursor,control))return true;
 return false;
}
static bool RestoreChromeSetters(std::deque<ChromeSetterChange>& changes) noexcept {
 bool complete=true;std::vector<ChromeStateRefresh> refresh;
 for(auto& entry:changes)try {
  auto setters=entry.state.Setters();
  if(entry.value.owned&&(setters.Size()<=entry.index||!Identity(setters.GetAt(entry.index),entry.value.applied)))entry.value.owned=false;
  if(!entry.value.owned)continue;
  if(auto control=entry.control.get())if(!SuspendChromeSetters(control,entry.group,refresh)){complete=false;continue;}
  complete=UpdateChromeFrame(entry.value,false,[&]{return ChromeFrameValue{setters.Size()>entry.index,setters.Size()>entry.index?setters.GetAt(entry.index):nullptr};},
   [&](auto const& value){setters.SetAt(entry.index,value.template as<SetterBase>());},[]{return ClockState::Stopped;})&&complete;
 }catch(...){complete=false;}
 complete=RefreshChromeColorStates(refresh)&&complete;
 if(complete)changes.clear();return complete;
}
template<class Entries,class RestoreEntry> static bool PruneChromeColorStates(Entries& entries,RestoreEntry restore) {
 bool complete=true;
 for(auto it=entries.begin();it!=entries.end();) {
  if(it->control.get()){++it;continue;}
  // The state objects can outlive their control. Restore their exact owned
  // values before releasing them; keep failed receipts for cleanup retry.
  Entries retired;retired.push_back(*it);
  if(!restore(retired)){*it=std::move(retired.front());complete=false;++it;}
  else it=entries.erase(it);
 }
 return complete;
}
static void ApplyChromeSetters(Control const& control,VisualStateGroup const& group,std::deque<ChromeSetterChange>& changes) {
 std::vector<ChromeStateRefresh> refresh;
 try {
  for(auto const& state:group.States()) {
   if(!ChromeSetterState(std::wstring_view{state.Name()}))continue;
   // Mixed animation states remain under native ownership. Their captured
   // color-only keyframes are handled separately, with stopped clocks.
   if(auto storyboard=state.Storyboard();storyboard&&storyboard.Children().Size())continue;
   auto setters=state.Setters();if(setters.IsSealed())continue;
   for(unsigned index=0;index<setters.Size();++index) {
    Setter original{nullptr};TargetPropertyPath target{nullptr};hstring path;
    if(!InspectChromeState([&] {
     original=setters.GetAt(index).try_as<Setter>();if(!original)return false;
     target=original.Target();if(!target||!SetterTargetInControl(original,control))return false;
     path=target.Path().Path();
     return ChromeSetterAdmission(std::wstring_view{path},bool(original.Value().try_as<Brush>()),setters.IsSealed());
    }))continue;
    bool tracked=false;for(auto const& prior:changes)if(Identity(prior.state,state)&&prior.index==index){tracked=true;break;}if(tracked)continue;
    if(!SuspendChromeSetters(control,group,refresh))continue;
    Setter applied;applied.Target(target);applied.Value(SolidColorBrush(ChromeSetterColor(std::wstring_view{path},std::wstring_view{state.Name()})));
    if(changes.size()>=4096)throw hresult_error(E_BOUNDS);
    changes.push_back({make_weak(control),state,group,index,{original,applied}});auto& entry=changes.back();
    if(!UpdateChromeFrame(entry.value,true,[&]{return ChromeFrameValue{setters.Size()>index,setters.Size()>index?setters.GetAt(index):nullptr};},
     [&](auto const& value){setters.SetAt(index,value.template as<SetterBase>());},[]{return ClockState::Stopped;}))throw hresult_error(E_FAIL);
   }
  }
 }catch(...){RefreshChromeColorStates(refresh);throw;}
 if(!RefreshChromeColorStates(refresh))throw hresult_error(E_FAIL);
}
static void ApplyChromeAnimationPalette(DependencyObject const& object,std::deque<ChromeAnimationChange>& changes,std::deque<ChromeSetterChange>& setters,std::deque<ChromeBaseChange>& bases,std::deque<ChromeTransitionChange>& transitions) {
 if(!PruneChromeColorStates(changes,RestoreChromeAnimations)||!PruneChromeColorStates(setters,RestoreChromeSetters))throw hresult_error(E_FAIL);
 auto control=object.try_as<Control>();if(!control||!control.IsLoaded())return;
 if(!object.try_as<Windows::UI::Xaml::Controls::Primitives::ButtonBase>()&&!object.try_as<MenuBarItem>())return;
 std::vector<DependencyObject> todo{object};unsigned visited=0;
 while(!todo.empty()&&visited++<64) {
  auto node=todo.back();todo.pop_back();
  ApplyChromeTransition(control,node,transitions);
  if(auto element=node.try_as<FrameworkElement>())for(auto const& group:VisualStateManager::GetVisualStateGroups(element)) {
   if(group.Name()!=L"CommonStates")continue;
   ApplyChromeBase(control,element,group,bases,transitions);
   ApplyChromeSetters(control,group,setters);
   std::vector<ChromeStateRefresh> refresh;
   try {
    for(auto const& state:group.States()) {
     auto stateName=state.Name();auto storyboard=state.Storyboard();
     if(!ChromeSetterState(std::wstring_view{stateName})||!ChromeColorStoryboard(storyboard))continue;
     bool tracked=false;for(auto const& prior:changes)if(Identity(prior.storyboard,storyboard)){tracked=true;break;}
     if(tracked)continue;
     if(!StopChromeColorState(control,group,storyboard,refresh))throw hresult_error(E_FAIL);
     for(auto const& child:storyboard.Children()) {
      auto animation=child.as<ObjectAnimationUsingKeyFrames>();auto frames=animation.KeyFrames();
      auto original=frames.GetAt(0).as<DiscreteObjectKeyFrame>();
      DiscreteObjectKeyFrame applied;applied.KeyTime(original.KeyTime());
      auto property=Storyboard::GetTargetProperty(animation);
      applied.Value(SolidColorBrush(ChromeSetterColor(std::wstring_view{property},std::wstring_view{stateName},Storyboard::GetTargetName(animation)==L"ChevronIcon")));
      if(changes.size()>=4096)throw hresult_error(E_BOUNDS);
      changes.push_back({make_weak(control),animation,storyboard,group,{original,applied}});auto& entry=changes.back();
      if(!UpdateChromeFrame(entry.frame,true,[&]{return ChromeFrameValue{frames.Size()==1,frames.Size()==1?frames.GetAt(0):nullptr};},
       [&](auto const& value){frames.SetAt(0,value.template as<ObjectKeyFrame>());},[&]{return storyboard.GetCurrentState();}))throw hresult_error(E_FAIL);
     }
    }
   }catch(...){RefreshChromeColorStates(refresh);throw;}
   if(!RefreshChromeColorStates(refresh))throw hresult_error(E_FAIL);
  }
  for(int i=0;i<VisualTreeHelper::GetChildrenCount(node);i++) {
   auto child=VisualTreeHelper::GetChild(node,i);
   if(child.try_as<Control>()||child.try_as<TextBlock>()||child.try_as<Image>())continue;
   todo.push_back(child);
  }
 }
}

[[clang::no_destroy]] static std::deque<ChromeTransitionChange> genericTransitions;
[[clang::no_destroy]] static std::deque<ChromeAnimationChange> genericAnimations;
[[clang::no_destroy]] static std::deque<ChromeSetterChange> genericSetters;
[[clang::no_destroy]] static std::deque<ChromeBaseChange> genericBases;
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
static bool CalculatorSpecializedStyle(std::wstring_view target,bool button) noexcept {
 return button&&target==L"CalculatorApp.Controls.CalculatorButton, CalculatorApp, Version=11.2607.0.0, Culture=neutral, PublicKeyToken=null";
}
static bool CalculatorSpecializedButton(DependencyObject const& object) {
 auto button=object.try_as<Button>();if(!button)return false;
 auto style=button.Style();return style&&CalculatorSpecializedStyle(std::wstring_view{style.TargetType().Name},true);
}
static void ApplyAnimationPalette(DependencyObject const& object) {
 auto button=object.try_as<Button>();if(!button)return;
 auto style=button.Style();
 if(!style||style.TargetType().Name!=L"CalculatorApp.Controls.CalculatorButton, CalculatorApp, Version=11.2607.0.0, Culture=neutral, PublicKeyToken=null")return;
 bool primary=Windows::UI::Xaml::Automation::AutomationProperties::GetAutomationId(button)==L"equalButton";
 std::vector<DependencyObject> nodes{button};unsigned visited=0;
 while(!nodes.empty()&&visited++<24) {
  auto node=nodes.back();nodes.pop_back();
  ApplyChromeTransition(button,node,genericTransitions);
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

static void ApplyOwnedBrush(DependencyObject const& object,DependencyProperty const& property,PCWSTR key) {
 for(auto const& prior:visualsChanged)if(prior.property==property&&Identity(prior.object.get(),object))return;
 auto local=object.ReadLocalValue(property);
 if(local&&!Identity(local,DependencyProperty::UnsetValue())&&!local.try_as<Brush>())return;
 SolidColorBrush applied(PaletteRule(key).color);
 visualsChanged.push_back({make_weak(object),property,local,applied});
 object.SetValue(property,applied);
}
// Native OS popup presenters may have a default-style acrylic brush that is
// not an alias of the application's resource dictionaries. Their frame colors
// are stable public properties, unlike a row's hover/pressed background.
// Preserve the exact local baseline and later app changes with the same owned
// dependency-property path used by focus brushes. Never change item templates.
static void ApplyPopupFrame(DependencyObject const& object) {
 if(!object.try_as<MenuFlyoutPresenter>()&&!object.try_as<ToolTip>()&&!object.try_as<FlyoutPresenter>())return;
 ApplyOwnedBrush(object,Control::BackgroundProperty(),object.try_as<ToolTip>()?L"ToolTipBackgroundBrush":L"SolidBackgroundFillColorBaseBrush");
 ApplyOwnedBrush(object,Control::ForegroundProperty(),L"TextFillColorPrimaryBrush");
 ApplyOwnedBrush(object,Control::BorderBrushProperty(),L"SystemControlTransientBorderBrush");
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

 if(object.try_as<Control>()||object.try_as<TextBlock>()) {
  // CalculationResult gives its TextBlock programmatic keyboard focus.
  ApplyOwnedBrush(object,FrameworkElement::FocusVisualPrimaryBrushProperty(),L"SystemControlFocusVisualPrimaryBrush");
  ApplyOwnedBrush(object,FrameworkElement::FocusVisualSecondaryBrushProperty(),L"SystemControlFocusVisualSecondaryBrush");
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
        ApplyPopupFrame(object);
        // Caption styles on custom CalculatorButtons and native ToggleButtons
        // use the shared ButtonBase path. The exact custom keypad style keeps
        // its specialized palette, including the primary equals action.
        if(CalculatorSpecializedButton(object)) {
         ApplyButtonStyle(object);ApplyAnimationPalette(object);
        }else ApplyChromeAnimationPalette(object,genericAnimations,genericSetters,genericBases,genericTransitions);
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
    bool restored=RestoreChromeTransitions(genericTransitions);
    restored=RestoreChromeAnimations(genericAnimations)&&restored;
    restored=RestoreChromeSetters(genericSetters)&&restored;
    restored=RestoreChromeBases(genericBases)&&restored;
    restored=RestoreAnimations(restartStates)&&restored;
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
