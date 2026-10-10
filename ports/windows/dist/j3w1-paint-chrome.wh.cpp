// ==WindhawkMod==
// @id j3w1-paint-chrome
// @name j3w1 Paint chrome
// @description Exact-package Paint chrome resources; document and artwork colors remain native
// @version 1.0.28
// @author j3w1
// @include mspaint.exe
// @architecture x86-64
// @compilerOptions -lole32 -loleaut32 -lruntimeobject -lbcrypt -ldwmapi
// ==/WindhawkMod==
// ==WindhawkModSettings==
/*
- enabled: true
*/
// ==/WindhawkModSettings==
#include <windows.h>
#include <appmodel.h>
#include <bcrypt.h>
#include <dwmapi.h>
#include <ocidl.h>
#include <xamlom.h>
#define J3W1_LEGACY_XAML 0
#undef GetCurrentTime
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>
#include <winrt/Windows.UI.Composition.h>
#if J3W1_LEGACY_XAML
#include <winrt/Windows.System.h>
#include <winrt/Windows.UI.Core.h>
#include <winrt/Windows.UI.Xaml.h>
#include <winrt/Windows.UI.Xaml.Hosting.h>
#include <winrt/Windows.UI.Xaml.Controls.h>
#include <winrt/Windows.UI.Xaml.Controls.Primitives.h>
#include <winrt/Windows.UI.Xaml.Shapes.h>
#include <winrt/Windows.UI.Xaml.Markup.h>
#include <winrt/Windows.UI.Xaml.Media.h>
#include <winrt/Windows.UI.Xaml.Media.Animation.h>
#else
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Windowing.h>
#include <winrt/Microsoft.UI.Dispatching.h>
#include <winrt/Microsoft.UI.Xaml.Hosting.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/Microsoft.UI.Xaml.Controls.Primitives.h>
#include <winrt/Microsoft.UI.Xaml.Shapes.h>
#include <winrt/Microsoft.UI.Xaml.Markup.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
#include <winrt/Microsoft.UI.Xaml.Media.Animation.h>
#include <winrt/Microsoft.UI.Composition.h>
#endif
#include <deque>
#include <array>
#include <vector>
#include <string>
#include <string_view>
#include <atomic>
#include <mutex>
#include <algorithm>
#include <cstdio>
#include <memory>
using namespace winrt;
using namespace Microsoft::UI::Xaml;
using namespace Microsoft::UI::Xaml::Media;
using namespace Microsoft::UI::Xaml::Controls;
using namespace Microsoft::UI::Xaml::Hosting;
using ProjectedObject=winrt::Windows::Foundation::IInspectable;
using Windows::UI::Color;
struct Rule { const wchar_t* key; Color color; const wchar_t* role; };
static constexpr Rule rules[]={
 {L"PaintButtonRestBackground",{255,0,0,0},L"color.surface.input"},
 {L"PaintButtonHoverBackground",{255,28,10,9},L"color.interaction.hover.bg"},
 {L"PaintButtonPressedBackground",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"PaintButtonSelectedBackground",{255,83,19,16},L"color.interaction.selection.bg"},
 {L"PaintToggleButtonSelectedBackground",{255,83,19,16},L"color.interaction.selection.bg"},
 {L"OverlayButtonBackgroundBrush",{255,22,11,11},L"color.surface.raised"},
 {L"OverlayButtonBorderBrush",{255,163,103,107},L"color.border.control"},
 {L"PanelHeaderIconButtonBackground",{255,0,0,0},L"color.surface.input"},
 {L"PanelHeaderIconButtonBorderBrush",{255,43,14,13},L"color.border.divider"},
 {L"MenuBarBackgroundBrush",{255,0,0,0},L"color.surface.canvas"},
 {L"MenuFlyoutItemBackgroundBrush",{255,22,11,11},L"color.surface.raised"},
 {L"HoverMenuItemSelectedBackgroundBrush",{255,99,15,13},L"color.interaction.hover.bg-strong"},
 {L"PressedMenuItemSelectedBackgroundBrush",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"MenuItemSelectedBackgroundBrush",{255,83,19,16},L"color.interaction.selection.bg"},
 {L"RibbonBackground",{255,0,0,0},L"color.surface.canvas"},
 {L"J3w1ScrollBarThumb",{255,66,15,12},L"color.interaction.scrollbar.thumb"},
 {L"SolidBackgroundFillColorBaseBrush",{255,0,0,0},L"color.surface.canvas"},
 {L"SolidBackgroundFillColorSecondaryBrush",{255,0,0,0},L"color.surface.canvas"},
 {L"SolidBackgroundFillColorTertiaryBrush",{255,0,0,0},L"color.surface.canvas"},
 {L"LayerFillColorDefaultBrush",{255,0,0,0},L"color.surface.canvas"},
 {L"LayerFillColorAltBrush",{255,0,0,0},L"color.surface.canvas"},
 {L"LayerOnMicaBaseAltFillColorDefaultBrush",{255,0,0,0},L"color.surface.canvas"},
 {L"NavigationViewDefaultPaneBackground",{255,0,0,0},L"color.surface.canvas"},
 {L"NavigationViewExpandedPaneBackground",{255,0,0,0},L"color.surface.canvas"},
 {L"NavigationViewTopPaneBackground",{255,0,0,0},L"color.surface.canvas"},
 {L"CardBackgroundFillColorDefaultBrush",{255,0,0,0},L"color.surface.input"},
 {L"CardBackgroundFillColorSecondaryBrush",{255,0,0,0},L"color.surface.input"},
 {L"ControlFillColorDefaultBrush",{255,0,0,0},L"color.surface.input"},
 {L"TextControlBackground",{255,0,0,0},L"color.surface.input"},
 {L"ButtonBackground",{255,0,0,0},L"color.surface.input"},
 {L"ControlFillColorSecondaryBrush",{255,28,10,9},L"color.interaction.hover.bg"},
 {L"ButtonBackgroundPointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
 {L"ControlFillColorTertiaryBrush",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"ButtonBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"ControlFillColorDisabledBrush",{255,22,11,11},L"color.interaction.disabled.bg"},
 {L"ControlStrokeColorDefaultBrush",{255,163,103,107},L"color.border.control"},
 {L"ControlStrokeColorSecondaryBrush",{255,163,103,107},L"color.border.control"},
 {L"ControlStrongStrokeColorDefaultBrush",{255,163,103,107},L"color.border.control"},
 {L"TextControlBorderBrush",{255,163,103,107},L"color.border.control"},
 {L"DividerStrokeColorDefaultBrush",{255,43,14,13},L"color.border.divider"},
 {L"SurfaceStrokeColorDefaultBrush",{255,43,14,13},L"color.border.divider"},
 {L"TextFillColorPrimaryBrush",{255,233,148,153},L"color.text.default"},
 {L"TextControlForeground",{255,233,148,153},L"color.text.default"},
 {L"ButtonForeground",{255,233,148,153},L"color.text.default"},
 {L"TextFillColorSecondaryBrush",{255,189,120,125},L"color.text.muted"},
 {L"TextFillColorTertiaryBrush",{255,189,120,125},L"color.text.muted"},
 {L"TextFillColorDisabledBrush",{255,138,85,89},L"color.text.disabled"},
 {L"AccentFillColorDefaultBrush",{255,125,19,16},L"color.action.primary.bg"},
 {L"AccentFillColorSecondaryBrush",{255,145,20,16},L"color.action.primary.hover-bg"},
 {L"AccentFillColorTertiaryBrush",{255,99,15,13},L"color.action.primary.pressed-bg"},
 {L"AccentTextFillColorPrimaryBrush",{255,255,162,167},L"color.text.bright"},
 {L"TextOnAccentFillColorPrimaryBrush",{255,255,162,167},L"color.text.bright"},
 {L"TextSelectionHighlightColorThemeBrush",{255,145,20,16},L"color.interaction.text-selection.bg"},
 {L"TabViewItemHeaderBackgroundSelected",{255,83,19,16},L"color.interaction.selection.bg"},
 {L"TabViewItemHeaderBackground",{255,9,7,7},L"color.surface.chrome"},
 {L"SystemControlFocusVisualPrimaryBrush",{255,229,57,53},L"color.interaction.focus.ring"},
 {L"SystemControlFocusVisualSecondaryBrush",{255,255,162,167},L"color.interaction.focus.ring-container"},
 {L"ApplicationPageBackgroundThemeBrush",{255,0,0,0},L"color.surface.canvas"},
 {L"PageBackground",{255,0,0,0},L"color.surface.canvas"},
 {L"WindowBackground",{255,0,0,0},L"color.surface.canvas"},
 {L"SystemControlBackgroundChromeMediumLowBrush",{255,0,0,0},L"color.surface.canvas"},
 {L"SystemControlBackgroundChromeLowBrush",{255,0,0,0},L"color.surface.canvas"},
 {L"DefaultTextForegroundThemeBrush",{255,233,148,153},L"color.text.default"},
 {L"SystemControlForegroundBaseHighBrush",{255,233,148,153},L"color.text.default"},
 {L"ToggleSwitchForeground",{255,233,148,153},L"color.text.default"},
 {L"ToggleSwitchForegroundPointerOver",{255,233,148,153},L"color.text.default"},
 {L"ToggleSwitchForegroundPressed",{255,233,148,153},L"color.text.default"},
 {L"ComboBoxForeground",{255,233,148,153},L"color.text.default"},
 {L"ToggleSwitchHeaderForegroundOn",{255,233,148,153},L"color.text.default"},
 {L"FocusStrokeColorOuterBrush",{255,229,57,53},L"color.interaction.focus.ring"},
 {L"FocusStrokeColorInnerBrush",{255,255,162,167},L"color.interaction.focus.ring-container"},
 {L"ToggleSwitchFillOn",{255,125,19,16},L"color.action.primary.bg"},
 {L"ToggleSwitchStrokeOn",{255,125,19,16},L"color.action.primary.bg"},
 {L"ToggleSwitchFillOnPointerOver",{255,145,20,16},L"color.action.primary.hover-bg"},
 {L"ToggleSwitchStrokeOnPointerOver",{255,145,20,16},L"color.action.primary.hover-bg"},
 {L"ToggleSwitchFillOnPressed",{255,99,15,13},L"color.action.primary.pressed-bg"},
 {L"ToggleSwitchStrokeOnPressed",{255,99,15,13},L"color.action.primary.pressed-bg"},
 {L"ToggleSwitchKnobFillOn",{255,255,162,167},L"color.action.primary.text"},
 {L"ToggleSwitchKnobFillOnPointerOver",{255,255,162,167},L"color.action.primary.text"},
 {L"ToggleSwitchKnobFillOnPressed",{255,255,162,167},L"color.action.primary.text"},
 {L"CardStrokeColorDefaultBrush",{255,43,14,13},L"color.border.divider"},
 {L"ExpanderContentBorderBrush",{255,43,14,13},L"color.border.divider"},
 {L"ExpanderHeaderBorderBrush",{255,43,14,13},L"color.border.divider"},
 {L"ExpanderHeaderBackground",{255,0,0,0},L"color.surface.input"},
 {L"ExpanderContentBackground",{255,0,0,0},L"color.surface.input"},
 {L"ExpanderHeaderForeground",{255,233,148,153},L"color.text.default"},
 {L"ExpanderHeaderForegroundPointerOver",{255,233,148,153},L"color.text.default"},
 {L"ExpanderHeaderForegroundPressed",{255,233,148,153},L"color.text.default"},
 {L"ExpanderHeaderDisabledForeground",{255,138,85,89},L"color.text.disabled"},
 {L"ExpanderHeaderBorderPointerOverBrush",{255,43,14,13},L"color.border.divider"},
 {L"ExpanderHeaderBorderPressedBrush",{255,43,14,13},L"color.border.divider"},
 {L"ExpanderHeaderDisabledBorderBrush",{255,125,19,16},L"color.border.disabled"},
 {L"ExpanderChevronForeground",{255,233,148,153},L"color.text.default"},
 {L"ExpanderChevronPointerOverForeground",{255,233,148,153},L"color.text.default"},
 {L"ExpanderChevronPressedForeground",{255,233,148,153},L"color.text.default"},
 {L"ExpanderChevronPointerOverBackground",{255,28,10,9},L"color.interaction.hover.bg"},
 {L"ExpanderChevronPressedBackground",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"MenuFlyoutPresenterBackground",{255,22,11,11},L"color.surface.raised"},
 {L"MenuFlyoutPresenterBorderBrush",{255,229,57,53},L"color.border.overlay"},
 {L"SurfaceStrokeColorFlyoutBrush",{255,229,57,53},L"color.border.overlay"},
 {L"MenuFlyoutSeparatorBackground",{255,43,14,13},L"color.border.divider"},
 {L"MenuFlyoutItemForeground",{255,233,148,153},L"color.text.default"},
 {L"MenuFlyoutItemForegroundPointerOver",{255,233,148,153},L"color.text.default"},
 {L"MenuFlyoutItemForegroundPressed",{255,233,148,153},L"color.text.default"},
 {L"MenuFlyoutSubItemForeground",{255,233,148,153},L"color.text.default"},
 {L"MenuFlyoutSubItemForegroundSubMenuOpened",{255,233,148,153},L"color.text.default"},
 {L"MenuFlyoutItemKeyboardAcceleratorTextForeground",{255,189,120,125},L"color.text.muted"},
 {L"MenuFlyoutSubItemChevron",{255,189,120,125},L"color.text.muted"},
 {L"MenuFlyoutItemForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
 {L"MenuFlyoutSubItemForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
 {L"MenuFlyoutItemBackgroundPointerOver",{255,99,15,13},L"color.interaction.hover.bg-strong"},
 {L"MenuFlyoutSubItemBackgroundPointerOver",{255,99,15,13},L"color.interaction.hover.bg-strong"},
 {L"MenuFlyoutSubItemBackgroundSubMenuOpened",{255,99,15,13},L"color.interaction.hover.bg-strong"},
 {L"MenuFlyoutItemBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"MenuFlyoutSubItemBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"MenuBarBackground",{255,0,0,0},L"color.surface.canvas"},
 {L"MenuBarItemForeground",{255,233,148,153},L"color.text.default"},
 {L"MenuBarItemBackground",{255,0,0,0},L"color.surface.canvas"},
 {L"MenuBarItemBackgroundPointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
 {L"MenuBarItemBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"MenuBarItemBackgroundSelected",{255,83,19,16},L"color.interaction.selection.bg"},
 {L"MenuBarItemBorderBrush",{255,43,14,13},L"color.border.divider"},
 {L"MenuBarItemBorderBrushPointerOver",{255,229,57,53},L"color.border.active"},
 {L"MenuBarItemBorderBrushPressed",{255,229,57,53},L"color.border.active"},
 {L"MenuBarItemBorderBrushSelected",{255,229,57,53},L"color.border.active"},
 {L"ButtonForegroundPointerOver",{255,233,148,153},L"color.text.default"},
 {L"ButtonForegroundPressed",{255,233,148,153},L"color.text.default"},
 {L"ButtonForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
 {L"ButtonBorderBrush",{255,163,103,107},L"color.border.control"},
 {L"ButtonBorderBrushPointerOver",{255,229,57,53},L"color.border.active"},
 {L"ButtonBorderBrushPressed",{255,229,57,53},L"color.border.active"},
 {L"ButtonBorderBrushDisabled",{255,125,19,16},L"color.border.disabled"},
 {L"MenuFlyoutItemBackground",{255,22,11,11},L"color.surface.raised"},
 {L"MenuFlyoutItemBackgroundDisabled",{255,22,11,11},L"color.surface.raised"},
 {L"MenuFlyoutSubItemBackground",{255,22,11,11},L"color.surface.raised"},
 {L"MenuFlyoutSubItemBackgroundDisabled",{255,22,11,11},L"color.surface.raised"},
 {L"MenuFlyoutSubItemForegroundPointerOver",{255,233,148,153},L"color.text.default"},
 {L"MenuFlyoutSubItemForegroundPressed",{255,233,148,153},L"color.text.default"},
 {L"AppBarButtonForeground",{255,233,148,153},L"color.text.default"},
 {L"AppBarButtonForegroundPointerOver",{255,233,148,153},L"color.text.default"},
 {L"AppBarButtonForegroundPressed",{255,233,148,153},L"color.text.default"},
 {L"AppBarButtonForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
 {L"AppBarToggleButtonForeground",{255,233,148,153},L"color.text.default"},
 {L"AppBarToggleButtonForegroundPointerOver",{255,233,148,153},L"color.text.default"},
 {L"AppBarToggleButtonForegroundPressed",{255,233,148,153},L"color.text.default"},
 {L"AppBarToggleButtonForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
 {L"AppBarToggleButtonForegroundChecked",{255,233,148,153},L"color.text.default"},
 {L"AppBarToggleButtonForegroundCheckedPointerOver",{255,233,148,153},L"color.text.default"},
 {L"AppBarToggleButtonForegroundCheckedPressed",{255,233,148,153},L"color.text.default"},
 {L"AppBarButtonBackground",{255,0,0,0},L"color.surface.canvas"},
 {L"AppBarButtonBackgroundPointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
 {L"AppBarButtonBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"AppBarButtonBackgroundDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
 {L"AppBarToggleButtonBackground",{255,0,0,0},L"color.surface.canvas"},
 {L"AppBarToggleButtonBackgroundPointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
 {L"AppBarToggleButtonBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"AppBarToggleButtonBackgroundDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
 {L"AppBarToggleButtonBackgroundChecked",{255,83,19,16},L"color.interaction.selection.bg"},
 {L"AppBarToggleButtonBackgroundCheckedPointerOver",{255,83,19,16},L"color.interaction.selection.bg"},
 {L"AppBarToggleButtonBackgroundCheckedPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"MenuFlyoutItemKeyboardAcceleratorTextForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
 {L"MenuFlyoutItemKeyboardAcceleratorTextForegroundPointerOver",{255,189,120,125},L"color.text.muted"},
 {L"MenuFlyoutItemKeyboardAcceleratorTextForegroundPressed",{255,189,120,125},L"color.text.muted"},
 {L"CommandBarForeground",{255,233,148,153},L"color.text.default"},
 {L"CommandBarBackground",{255,0,0,0},L"color.surface.canvas"},
 {L"CommandBarBackgroundOpen",{255,0,0,0},L"color.surface.canvas"},
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
 {L"KeyTipBackground",{255,22,11,11},L"color.surface.raised"},
 {L"KeyTipBorderBrush",{255,229,57,53},L"color.border.overlay"},
 {L"KeyTipForeground",{255,233,148,153},L"color.text.default"},
 {L"RadioButtonForeground",{255,233,148,153},L"color.text.default"},
 {L"RadioButtonForegroundPointerOver",{255,233,148,153},L"color.text.default"},
 {L"RadioButtonForegroundPressed",{255,233,148,153},L"color.text.default"},
 {L"RadioButtonForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
 {L"ComboBoxBackground",{255,0,0,0},L"color.surface.input"},
 {L"ComboBoxBackgroundUnfocused",{255,0,0,0},L"color.surface.input"},
 {L"ComboBoxBackgroundFocused",{255,0,0,0},L"color.surface.input"},
 {L"ComboBoxBackgroundPointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
 {L"ComboBoxBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"ComboBoxBackgroundDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
 {L"ComboBoxForegroundPointerOver",{255,233,148,153},L"color.text.default"},
 {L"ComboBoxForegroundPressed",{255,233,148,153},L"color.text.default"},
 {L"ComboBoxForegroundFocused",{255,233,148,153},L"color.text.default"},
 {L"ComboBoxForegroundFocusedPressed",{255,233,148,153},L"color.text.default"},
 {L"ComboBoxForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
 {L"ComboBoxBorderBrush",{255,163,103,107},L"color.border.control"},
 {L"ComboBoxBorderBrushPointerOver",{255,163,103,107},L"color.border.control"},
 {L"ComboBoxBorderBrushPressed",{255,163,103,107},L"color.border.control"},
 {L"ComboBoxBorderBrushDisabled",{255,125,19,16},L"color.border.disabled"},
 {L"ComboBoxBackgroundBorderBrushFocused",{255,229,57,53},L"color.interaction.focus.ring"},
 {L"ComboBoxBackgroundBorderBrushUnfocused",{255,163,103,107},L"color.border.control"},
 {L"ComboBoxDropDownBackground",{255,22,11,11},L"color.surface.raised"},
 {L"ComboBoxDropDownBorderBrush",{255,229,57,53},L"color.border.overlay"},
 {L"ComboBoxDropDownForeground",{255,233,148,153},L"color.text.default"},
 {L"ComboBoxDropDownGlyphForeground",{255,189,120,125},L"color.text.muted"},
 {L"ComboBoxDropDownGlyphForegroundFocused",{255,189,120,125},L"color.text.muted"},
 {L"ComboBoxDropDownGlyphForegroundFocusedPressed",{255,189,120,125},L"color.text.muted"},
 {L"ComboBoxDropDownGlyphForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
 {L"ComboBoxItemBackground",{255,22,11,11},L"color.surface.raised"},
 {L"ComboBoxItemForeground",{255,233,148,153},L"color.text.default"},
 {L"ComboBoxItemBackgroundPointerOver",{255,99,15,13},L"color.interaction.hover.bg-strong"},
 {L"ComboBoxItemForegroundPointerOver",{255,233,148,153},L"color.text.default"},
 {L"ComboBoxItemBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"ComboBoxItemForegroundPressed",{255,233,148,153},L"color.text.default"},
 {L"ComboBoxItemBackgroundDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
 {L"ComboBoxItemForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
 {L"ComboBoxItemBackgroundSelected",{255,83,19,16},L"color.interaction.selection.bg"},
 {L"ComboBoxItemForegroundSelected",{255,244,238,238},L"color.interaction.selection.text"},
 {L"ComboBoxItemBackgroundSelectedUnfocused",{255,66,15,12},L"color.interaction.selection.inactive-bg"},
 {L"ComboBoxItemForegroundSelectedUnfocused",{255,233,148,153},L"color.interaction.selection.inactive-text"},
 {L"ComboBoxItemBackgroundSelectedPointerOver",{255,83,19,16},L"color.interaction.selection.bg"},
 {L"ComboBoxItemForegroundSelectedPointerOver",{255,244,238,238},L"color.interaction.selection.text"},
 {L"ComboBoxItemBackgroundSelectedPressed",{255,83,19,16},L"color.interaction.selection.bg"},
 {L"ComboBoxItemForegroundSelectedPressed",{255,244,238,238},L"color.interaction.selection.text"},
 {L"ComboBoxItemBackgroundSelectedDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
 {L"ComboBoxItemForegroundSelectedDisabled",{255,138,85,89},L"color.text.disabled"},
 {L"ComboBoxItemPillFillBrush",{255,229,57,53},L"color.border.selected-indicator"},
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
 {L"SliderTrackFill",{255,163,103,107},L"color.border.control"},
 {L"SliderTrackFillPointerOver",{255,163,103,107},L"color.border.control"},
 {L"SliderTrackFillPressed",{255,163,103,107},L"color.border.control"},
 {L"SliderTrackFillDisabled",{255,125,19,16},L"color.border.disabled"},
 {L"SliderTrackValueFill",{255,125,19,16},L"color.action.primary.bg"},
 {L"SliderTrackValueFillPointerOver",{255,145,20,16},L"color.action.primary.hover-bg"},
 {L"SliderTrackValueFillPressed",{255,99,15,13},L"color.action.primary.pressed-bg"},
 {L"SliderTrackValueFillDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
 {L"SliderThumbBackground",{255,125,19,16},L"color.action.primary.bg"},
 {L"SliderThumbBackgroundPointerOver",{255,145,20,16},L"color.action.primary.hover-bg"},
 {L"SliderThumbBackgroundPressed",{255,99,15,13},L"color.action.primary.pressed-bg"},
 {L"SliderThumbBackgroundDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
 {L"SliderThumbBorderBrush",{255,163,103,107},L"color.border.control"},
 {L"SliderOuterThumbBackground",{255,0,0,0},L"color.surface.input"},
 {L"SliderHeaderForeground",{255,233,148,153},L"color.text.default"},
 {L"SliderTickBarFill",{255,163,103,107},L"color.border.control"},
 {L"SliderInlineTickBarFill",{255,0,0,0},L"color.surface.input"},
 {L"FlyoutPresenterBackground",{255,22,11,11},L"color.surface.raised"},
 {L"FlyoutBorderThemeBrush",{255,229,57,53},L"color.border.overlay"},
 {L"ToolTipBackgroundBrush",{255,36,16,16},L"color.surface.overlay"},
 {L"ToolTipForegroundBrush",{255,233,148,153},L"color.text.default"},
 {L"ToolTipBorderBrush",{255,229,57,53},L"color.border.overlay"},
 {L"ScrollBarBackground",{255,12,9,9},L"color.interaction.scrollbar.track"},
 {L"ScrollBarBackgroundPointerOver",{255,12,9,9},L"color.interaction.scrollbar.track"},
 {L"ScrollBarBackgroundDisabled",{255,12,9,9},L"color.interaction.scrollbar.track"},
 {L"ScrollBarButtonBackground",{255,12,9,9},L"color.interaction.scrollbar.track"},
 {L"ScrollBarButtonBackgroundDisabled",{255,12,9,9},L"color.interaction.scrollbar.track"},
 {L"ScrollBarTrackFill",{255,12,9,9},L"color.interaction.scrollbar.track"},
 {L"ScrollBarTrackFillPointerOver",{255,12,9,9},L"color.interaction.scrollbar.track"},
 {L"ScrollBarTrackFillDisabled",{255,12,9,9},L"color.interaction.scrollbar.track"},
 {L"ScrollBarTrackStroke",{255,12,9,9},L"color.interaction.scrollbar.track"},
 {L"ScrollBarTrackStrokePointerOver",{255,12,9,9},L"color.interaction.scrollbar.track"},
 {L"ScrollBarTrackStrokeDisabled",{255,12,9,9},L"color.interaction.scrollbar.track"},
 {L"ScrollBarThumbFill",{255,66,15,12},L"color.interaction.scrollbar.thumb"},
 {L"ScrollBarThumbBackground",{255,66,15,12},L"color.interaction.scrollbar.thumb"},
 {L"ScrollBarPanningThumbBackground",{255,66,15,12},L"color.interaction.scrollbar.thumb"},
 {L"ScrollBarThumbFillPointerOver",{255,145,20,16},L"color.interaction.scrollbar.thumb-hover"},
 {L"ScrollBarThumbFillPressed",{255,145,20,16},L"color.interaction.scrollbar.thumb-hover"},
 {L"ScrollBarThumbFillDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
 {L"ScrollBarPanningThumbBackgroundDisabled",{255,22,11,11},L"color.interaction.disabled.bg"},
 {L"ScrollBarBorderBrush",{255,43,14,13},L"color.border.divider"},
 {L"ScrollBarBorderBrushPointerOver",{255,43,14,13},L"color.border.divider"},
 {L"ScrollBarBorderBrushDisabled",{255,43,14,13},L"color.border.divider"},
 {L"ScrollBarButtonBorderBrush",{255,43,14,13},L"color.border.divider"},
 {L"ScrollBarButtonBorderBrushPointerOver",{255,43,14,13},L"color.border.divider"},
 {L"ScrollBarButtonBorderBrushPressed",{255,43,14,13},L"color.border.divider"},
 {L"ScrollBarButtonBorderBrushDisabled",{255,43,14,13},L"color.border.divider"},
 {L"ScrollBarThumbBorderBrush",{255,43,14,13},L"color.border.divider"},
 {L"ScrollBarButtonBackgroundPointerOver",{255,28,10,9},L"color.interaction.hover.bg"},
 {L"ScrollBarButtonBackgroundPressed",{255,66,15,12},L"color.interaction.pressed.bg"},
 {L"ScrollBarButtonArrowForeground",{255,233,148,153},L"color.text.default"},
 {L"ScrollBarButtonArrowForegroundPointerOver",{255,255,162,167},L"color.text.bright"},
 {L"ScrollBarButtonArrowForegroundPressed",{255,255,162,167},L"color.text.bright"},
 {L"ScrollBarButtonArrowForegroundDisabled",{255,138,85,89},L"color.text.disabled"},
};
static bool Same(Color a,Color b){return a.A==b.A&&a.R==b.R&&a.G==b.G&&a.B==b.B;}
static bool Identity(ProjectedObject const& a,ProjectedObject const& b){
 return a&&b&&get_abi(a.as<Windows::Foundation::IUnknown>())==get_abi(b.as<Windows::Foundation::IUnknown>());
}
static bool HighContrast(){HIGHCONTRASTW value{sizeof(value)};
 return !SystemParametersInfoW(SPI_GETHIGHCONTRAST,sizeof(value),&value,0)||(value.dwFlags&HCF_HIGHCONTRASTON);}
static bool ChromeUiThread(FrameworkElement const& element) {
#if J3W1_LEGACY_XAML
 return element&&element.Dispatcher().HasThreadAccess();
#else
 return element&&element.DispatcherQueue().HasThreadAccess();
#endif
}
static std::atomic<int> runtimeStatus{0};
static bool ReviewedPackage(){
    UINT32 length=0;
    if(GetCurrentPackageFullName(&length,nullptr)!=ERROR_INSUFFICIENT_BUFFER||length>512)return false;
    std::vector<wchar_t> name(length);
    if(GetCurrentPackageFullName(&length,name.data())!=ERROR_SUCCESS)return false;
    for(auto allowed:{L"Microsoft.Paint_11.2605.81.0_x64__8wekyb3d8bbwe"})if(wcscmp(name.data(),allowed)==0)return true;
    return false;
}
static bool RuntimeFileDigest(std::wstring const& path,const char* expected) {
    HANDLE file=CreateFileW(path.c_str(),GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr);
    if(file==INVALID_HANDLE_VALUE)return false;
    BCRYPT_ALG_HANDLE algorithm=nullptr;BCRYPT_HASH_HANDLE hash=nullptr;
    DWORD size=0,written=0;std::vector<BYTE> object;BYTE digest[32]{};bool valid=false;
    if(BCryptOpenAlgorithmProvider(&algorithm,BCRYPT_SHA256_ALGORITHM,nullptr,0)>=0
       &&BCryptGetProperty(algorithm,BCRYPT_OBJECT_LENGTH,reinterpret_cast<PUCHAR>(&size),sizeof(size),&written,0)>=0){
        object.resize(size);
        if(BCryptCreateHash(algorithm,&hash,object.data(),size,nullptr,0,0)>=0){
            BYTE buffer[65536];DWORD count=0;bool complete=false;
            for(;;){if(!ReadFile(file,buffer,sizeof(buffer),&count,nullptr))break;
                if(!count){complete=true;break;}if(BCryptHashData(hash,buffer,count,0)<0)break;}
            if(complete&&BCryptFinishHash(hash,digest,sizeof(digest),0)>=0){
                constexpr char hex[]="0123456789abcdef";std::string actual;
                for(BYTE byte:digest){actual+=hex[byte>>4];actual+=hex[byte&15];}
                valid=actual==expected;
            }
        }
    }
    if(hash)BCryptDestroyHash(hash);if(algorithm)BCryptCloseAlgorithmProvider(algorithm,0);CloseHandle(file);
    return valid;
}
static bool ReviewedRuntime(){
    if(int status=runtimeStatus.load())return status==1;
    auto module=GetModuleHandleW(L"Microsoft.UI.Xaml.dll");if(!module)return false;
    wchar_t path[32768]{};DWORD length=GetModuleFileNameW(module,path,std::size(path));
    if(!length||length>=std::size(path))return false;
    std::wstring name=path;
#if J3W1_LEGACY_XAML
    wchar_t system[32768]{};auto systemLength=GetSystemDirectoryW(system,std::size(system));
    if(!systemLength||systemLength>=std::size(system)||_wcsicmp(name.c_str(),(std::wstring(system)+L"\\Microsoft.UI.Xaml.dll").c_str())){runtimeStatus=-1;return false;}
#else
    if(name.find(L"\\Microsoft.WindowsAppRuntime.2_2.5.1.0_x64__8wekyb3d8bbwe\\")==std::wstring::npos){runtimeStatus=-1;return false;}
#endif
    bool valid=RuntimeFileDigest(path,"aad12524765e6fb63f0ae26a45a9ba3104f24fde66413d8a3036fbed74a1e990");
#if J3W1_LEGACY_XAML
    auto controls=GetModuleHandleW(L"Microsoft.UI." L"Xaml.dll");if(!controls)return false;
    wchar_t controlsPath[32768]{};auto controlsLength=GetModuleFileNameW(controls,controlsPath,std::size(controlsPath));
    if(!controlsLength||controlsLength>=std::size(controlsPath))return false;
    if(std::wstring(controlsPath).find(L"\\\\")==std::wstring::npos)valid=false;
    else valid=RuntimeFileDigest(controlsPath,"")&&valid;
#endif
    runtimeStatus=valid?1:-1;return valid;
}

static Windows::Foundation::IActivationFactory Factory(wchar_t const* name) {
#if J3W1_LEGACY_XAML
 Windows::Foundation::IActivationFactory factory{nullptr};hstring type=name;
 auto module=GetModuleHandleW(L"combase.dll");
 auto getFactory=reinterpret_cast<HRESULT(WINAPI*)(void*,REFIID,void**)>(module?GetProcAddress(module,"RoGetActivationFactory"):nullptr);
 if(!getFactory)throw hresult_error(E_NOINTERFACE);
 check_hresult(getFactory(get_abi(type),reinterpret_cast<GUID const&>(guid_of<Windows::Foundation::IActivationFactory>()),reinterpret_cast<void**>(put_abi(factory))));return factory;
#else
 auto module=GetModuleHandleW(L"Microsoft.UI.Xaml.dll");
 auto getFactory=reinterpret_cast<HRESULT(WINAPI*)(void*,void**)>(module?GetProcAddress(module,"DllGetActivationFactory"):nullptr);
 if(!getFactory)throw hresult_error(E_NOINTERFACE);
 Windows::Foundation::IActivationFactory factory{nullptr};hstring type=name;
 check_hresult(getFactory(get_abi(type),put_abi(factory)));return factory;
#endif
}


static void Log(unsigned,unsigned=0,unsigned=0) {}

struct Palette { const Rule* rule; SolidColorBrush applied{nullptr}; std::vector<Brush> aliases; };
struct Visual { weak_ref<DependencyObject> object; DependencyProperty property{nullptr}; ProjectedObject before{nullptr}; Brush applied{nullptr}; };
// Reevaluate named theme resources on an admitted chrome control. Native
// Background/Foreground expressions and visual-state setters remain intact.
// A failed restoration retains its exact local baseline for the UI-thread
// cleanup path. No document, palette, root layout or caption is refreshed.
struct OwnedThemeRefresh {
 weak_ref<FrameworkElement> element;
 ProjectedObject before{nullptr};
 ElementTheme requested=ElementTheme::Default;
 bool pending=false,complete=false;
};
static bool SameLocalTheme(ProjectedObject const& local,ElementTheme theme) {
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
 hstring key; ProjectedObject before{nullptr},applied{nullptr}; bool local=false,owned=false;
};
struct ControlResources {
 weak_ref<FrameworkElement> element; ResourceDictionary owner{nullptr}; std::vector<ControlKey> keys; OwnedThemeRefresh refresh;
};
struct LocalResourceValue { bool exists=false; ProjectedObject value{nullptr}; };
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

struct Root { weak_ref<FrameworkElement> element; weak_ref<FrameworkElement> backgroundElement; weak_ref<DesktopWindowXamlSource> source; weak_ref<Window> window; event_token layout{}; ResourceDictionary owner{nullptr},overlay{nullptr}; ProjectedObject themeBefore{nullptr}; bool themeTouched=false;
#if !J3W1_LEGACY_XAML
 SystemBackdrop backdropBefore{nullptr}; bool backdropTracked=false;
#endif
 DependencyProperty backgroundProperty{nullptr}; ProjectedObject backgroundBefore{nullptr}; SolidColorBrush backgroundApplied{nullptr}; std::vector<Palette> palette; std::vector<Visual> changes; std::deque<OwnedThemeRefresh> refreshes; std::deque<ControlResources> controls; };
struct PendingRoot { weak_ref<FrameworkElement> element; unsigned attempts=0; };
struct PopupLoadReceipt { weak_ref<FrameworkElement> element; event_token loaded{}; bool registered=false; };
// Retain a failed event removal so shutdown can retry before unloading code.
// Expired elements have already released their subscription; do not revive them.
template<class Entries,class Resolve,class Select,class Remove>
static bool RevokePopupLoadEvents(Entries& entries,Resolve resolve,Select select,Remove remove) noexcept {
 bool complete=true;
 for(auto it=entries.begin();it!=entries.end();)try {
  auto element=resolve(*it);
  if(!element){it=entries.erase(it);continue;}
  if(!select(element)){++it;continue;}
  if(it->registered&&!remove(element,it->loaded)){complete=false;++it;continue;}
  it=entries.erase(it);
 }catch(...){complete=false;++it;}
 return complete;
}
// Readable caption customization is admitted separately from the XAML roots.
// Extended title content is refused so native tabs and drag geometry remain
// owned by the application.

// Recolor a named native brush while retaining property bindings and state
// transitions. A transient hover value never becomes a permanent local value.
struct OwnedNativeBrush { SolidColorBrush brush{nullptr}; Color before{},applied{}; bool owned=false,changed=false; };
template<class Read,class Write> static bool UpdateNativeBrush(OwnedNativeBrush& entry,Color target,bool active,Read read,Write write,HRESULT* failure=nullptr) noexcept {
 if(failure)*failure=S_OK;
 auto failed=[&](HRESULT error) noexcept {
  // A denied setter may have made no change. Retain ownership only if a
  // readback can still require restoration, including mutation-then-throw.
  if(entry.owned)try {
   const Color after=read();
   if(Same(after,entry.before))entry.owned=false;
   else if(!Same(after,entry.applied)){entry.owned=false;entry.changed=true;}
  }catch(...){}
  if(failure)*failure=error;return false;
 };
 try {
  Color current=read();
  if(entry.owned&&!Same(current,entry.applied)){entry.owned=false;entry.changed=true;}
  if(!active) {
   if(entry.owned){write(entry.before);entry.owned=false;}
   return true;
  }
  if(entry.changed||entry.owned)return true;
  entry.before=current;entry.applied=target;entry.owned=true;write(target);return true;
 }catch(winrt::hresult_error const& error){return failed(error.code().value);}
 catch(...){return failed(E_FAIL);}
}
static bool RestoreNativeBrushes(std::vector<OwnedNativeBrush>& entries) noexcept {
 bool restored=true;
 for(auto it=entries.rbegin();it!=entries.rend();++it)
  restored=UpdateNativeBrush(*it,it->applied,false,[&]{return it->brush.Color();},[&](Color c){it->brush.Color(c);})&&restored;
 if(restored)entries.clear();
 return restored;
}
static bool ApplyNativeBrush(std::vector<OwnedNativeBrush>& entries,SolidColorBrush const& brush,Color target,HRESULT* failure=nullptr) {
 for(auto& entry:entries)if(Identity(entry.brush,brush))
  return UpdateNativeBrush(entry,target,true,[&]{return brush.Color();},[&](Color c){brush.Color(c);},failure);
 entries.push_back({brush});
 return UpdateNativeBrush(entries.back(),target,true,[&]{return brush.Color();},[&](Color c){brush.Color(c);},failure);
}

// Native templates can retain a resolved brush inside a zero-time object
// keyframe. Local ThemeResource overrides do not replace that cached value.
// Exchange only the observed color-only storyboard shape, with its clock
// stopped; retain original keyframe objects and their expressions for rollback.
using namespace Microsoft::UI::Xaml::Media::Animation;
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
// Paint's two custom toolbar split buttons have an independently animated
// outer Border. Admit its recorded direct ownership chain, never a border
// solely by its name or color. Geometry, commands and child states stay native.
static bool PaintSplitOuterAdmission(std::wstring_view name,bool border,bool directOwner,
 std::wstring_view button,std::wstring_view grid,std::wstring_view owner) noexcept {
 return border&&directOwner&&name==L"SelectionBorderOuter"
  &&button==L"Microsoft.UI.Xaml.Controls.Button"
  &&grid==L"Microsoft.UI.Xaml.Controls.Grid"&&owner==L"PaintUI.SelectableSplitButton";
}
static bool PaintSplitOuterPart(Control const& control,DependencyObject const& object) {
 auto border=object.try_as<Border>();if(!border||!control)return false;
 auto direct=VisualTreeHelper::GetParent(object),grid=VisualTreeHelper::GetParent(control);
 auto owner=grid?VisualTreeHelper::GetParent(grid):nullptr;
 return PaintSplitOuterAdmission(std::wstring_view{border.Name()},true,Identity(direct,control),
  std::wstring_view{get_class_name(control)},grid?std::wstring_view{get_class_name(grid)}:L"",
  owner?std::wstring_view{get_class_name(owner)}:L"");
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
 if(!presenter||!presenter.IsLoaded())return;
 if(!PaintSplitOuterPart(control,object)&&!ChromeTransitionPartAdmission(std::wstring_view{presenter.Name()},
  bool(object.try_as<ContentPresenter>()),bool(object.try_as<Panel>()),bool(object.try_as<Border>())))return;
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
 if(!object.try_as<Microsoft::UI::Xaml::Controls::Primitives::ButtonBase>()&&!object.try_as<MenuBarItem>())return;
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

// The recorded split-button edge uses two writable native white gradient
// stops. Give both the existing hover-border role, producing one flat edge.
// Never replace the brush, offsets, collection or template. Protected data
// brushes and their shared stops grant no admission.
static bool PaintSplitEdgeShape(unsigned count,double first,double last) noexcept {
 return count==2&&first==double(0.33f)&&last==1.0;
}
static bool PaintSplitEdgeAdmission(bool part,bool protectedIdentity,unsigned count,double first,double last,Color top,Color bottom) noexcept {
 return part&&!protectedIdentity&&PaintSplitEdgeShape(count,first,last)
  &&Same(top,{24,255,255,255})&&Same(bottom,{18,255,255,255});
}
template<class Read,class Write> static bool UpdatePaintSplitEdge(std::array<OwnedNativeBrush,2>& values,Color target,bool active,Read read,Write write) noexcept {
 bool complete=true;
 for(unsigned index=0;index<2;++index)
  complete=UpdateNativeBrush(values[index],target,active,[&]{return read(index);},[&](Color color){write(index,color);})&&complete;
 return complete;
}
struct PaintSplitEdgeReceipt {
 weak_ref<Border> owner;LinearGradientBrush brush{nullptr};
 std::array<GradientStop,2> stops;std::array<OwnedNativeBrush,2> values;
};
static bool RestorePaintSplitEdge(PaintSplitEdgeReceipt& entry) noexcept {
 return UpdatePaintSplitEdge(entry.values,{},false,[&](unsigned i){return entry.stops[i].Color();},
  [&](unsigned i,Color color){entry.stops[i].Color(color);});
}
static bool RestorePaintSplitEdges(std::deque<PaintSplitEdgeReceipt>& entries,bool retiredOnly=false) noexcept {
 bool complete=true;
 for(auto it=entries.begin();it!=entries.end();)try {
  auto owner=it->owner.get();
  if(retiredOnly&&owner){++it;continue;}
  if(!RestorePaintSplitEdge(*it)){complete=false;++it;continue;}
  // Preserve later app writes through deactivation/high-contrast cycles.
  // These refusal markers retire only with their exact outer-border owner.
  if(owner&&(it->values[0].changed||it->values[1].changed)){++it;continue;}
  it=entries.erase(it);
 }catch(...){complete=false;++it;}
 return complete;
}
static bool ProtectedPaintSplitEdge(LinearGradientBrush const& gradient,std::array<GradientStop,2> const& stops,std::vector<Brush> const& protectedBrushes) {
 for(auto const& data:protectedBrushes) {
  if(Identity(data,gradient))return true;
  if(auto other=data.try_as<LinearGradientBrush>())for(auto stop:other.GradientStops())
   for(auto const& target:stops)if(Identity(stop,target))return true;
 }
 return false;
}
static bool ApplyPaintSplitEdge(std::deque<PaintSplitEdgeReceipt>& entries,DependencyObject const& object,
 DependencyProperty const& property,Brush const& brush,std::vector<Brush> const& protectedBrushes) {
 if(!RestorePaintSplitEdges(entries,true))throw hresult_error(E_FAIL);
 auto border=object.try_as<Border>();
 if(!border||!Identity(property,Border::BorderBrushProperty()))return false;
 auto control=VisualTreeHelper::GetParent(object).try_as<Control>();
 if(!PaintSplitOuterPart(control,object))return false;
 auto gradient=brush.try_as<LinearGradientBrush>();if(!gradient)return false;
 auto collection=gradient.GradientStops();if(collection.Size()!=2)return false;
 std::array<GradientStop,2> stops{collection.GetAt(0),collection.GetAt(1)};
 if(!PaintSplitEdgeShape(collection.Size(),stops[0].Offset(),stops[1].Offset())
  ||ProtectedPaintSplitEdge(gradient,stops,protectedBrushes))return false;
 Color color{};bool found=false;
 for(auto const& rule:rules)if(wcscmp(rule.key,L"ButtonBorderBrushPointerOver")==0){color=rule.color;found=true;break;}
 if(!found)return false;
 for(auto& entry:entries)if(Identity(entry.brush,gradient)) {
  if(!Identity(entry.owner.get(),border)||!Identity(entry.stops[0],stops[0])||!Identity(entry.stops[1],stops[1]))return false;
  // Re-read tracked Colors: an app write ends ownership of that stop.
  if(!UpdatePaintSplitEdge(entry.values,color,true,[&](unsigned i){return stops[i].Color();},
   [&](unsigned i,Color value){stops[i].Color(value);}))throw hresult_error(E_FAIL);
  return true;
 }
 if(!PaintSplitEdgeAdmission(true,false,collection.Size(),stops[0].Offset(),stops[1].Offset(),stops[0].Color(),stops[1].Color()))return false;
 // Also refuse a stop already owned through a different chrome brush.
 for(auto const& entry:entries)for(auto const& prior:entry.stops)for(auto const& stop:stops)if(Identity(prior,stop))return false;
 if(entries.size()>=2048)throw hresult_error(E_BOUNDS); // at most 4096 stops
 entries.push_back({make_weak(border),gradient,stops,{}});auto& entry=entries.back();
 if(!UpdatePaintSplitEdge(entry.values,color,true,[&](unsigned i){return stops[i].Color();},
  [&](unsigned i,Color value){stops[i].Color(value);}))throw hresult_error(E_FAIL);
 return true;
}
// Public composition backing, without AppWindow.TitleBar or title-mode writes.
// Retain the exact native brush; a nullable original is still a readable value.
struct OwnedCompositionBrush {ProjectedObject before{nullptr},applied{nullptr};bool owned=false,changed=false;};
static bool SameCompositionObject(ProjectedObject const& a,ProjectedObject const& b) {return (!a&&!b)||Identity(a,b);}
template<class Read,class Write> static bool UpdateCompositionBrush(OwnedCompositionBrush& entry,bool active,Read read,Write write) noexcept {
 if(!active&&!entry.owned)return true;
 try {
  auto current=read();
  if(entry.owned&&!SameCompositionObject(current,entry.applied)){entry.owned=false;entry.changed=true;}
  if(!active){if(entry.owned){write(entry.before);entry.owned=false;}return true;}
  if(entry.changed||entry.owned)return true;
  entry.before=current;entry.owned=true;write(entry.applied);return true;
 }catch(...) {
  if(entry.owned)try {auto current=read();if(SameCompositionObject(current,entry.before))entry.owned=false;
   else if(!SameCompositionObject(current,entry.applied)){entry.owned=false;entry.changed=true;}}catch(...){}
  return false;
 }
}
#if !J3W1_LEGACY_XAML
// IWindowNative is the documented one-method IUnknown ABI in
// microsoft.ui.xaml.window.h. The pinned compiler omits that interop header.
struct NativeXamlWindow : ::IUnknown {virtual HRESULT STDMETHODCALLTYPE get_WindowHandle(HWND*)=0;};
static constexpr GUID nativeXamlWindowId={0x45d64a29,0xa63e,0x4cb6,{0xb4,0x98,0x57,0x81,0xd2,0x98,0xcb,0x4f}};
struct WindowBacking {
 HWND window=nullptr;Microsoft::UI::Composition::ICompositionSupportsSystemBackdrop target{nullptr};OwnedCompositionBrush brush;
};
static constexpr PCWSTR windowBackingProperty=L"j3w1-paint-chrome-composition-backing";
static bool OwnsWindowBacking(WindowBacking const& entry) {
 DWORD process=0;auto thread=GetWindowThreadProcessId(entry.window,&process);
 return thread==GetCurrentThreadId()&&process==GetCurrentProcessId()&&GetPropW(entry.window,windowBackingProperty)==&entry;
}
static bool RestoreWindowBackings(std::vector<std::unique_ptr<WindowBacking>>& entries) noexcept {
 bool complete=true;
 for(auto it=entries.begin();it!=entries.end();) {
  auto& entry=**it;
  if(OwnsWindowBacking(entry)&&!UpdateCompositionBrush(entry.brush,false,[&]{return entry.target.SystemBackdrop();},
    [&](auto const& brush){entry.target.SystemBackdrop(brush?brush.template as<Windows::UI::Composition::CompositionBrush>():Windows::UI::Composition::CompositionBrush{nullptr});})) {complete=false;++it;continue;}
  if(OwnsWindowBacking(entry))RemovePropW(entry.window,windowBackingProperty);
  it=entries.erase(it);
 }
 return complete;
}
#endif
#include <winrt/Windows.UI.Xaml.Interop.h>
// The recorded Paint menu presenter has a DesktopAcrylicBackdrop behind
// its already-themed brushes, including before its first layout. Use only
// the public presenter property. Never infer a popup HWND or modify artwork.
struct PopupBacking { weak_ref<MenuFlyoutPresenter> element; OwnedCompositionBrush value; };
static void ApplyPopupBacking(Root& root,FrameworkElement const& element);

// The exact Paint toolbar creates MenuBarItemFlyout on ContentButton before
// opening. Prepare only its previously unset presenter style, so the native
// presenter receives the semantic surface before its first layout.
struct PreopenMenuStyle { weak_ref<FrameworkElement> owner; weak_ref<MenuFlyout> element; OwnedCompositionBrush value; };
static void PreparePaintMenuStyle(Root& root,FrameworkElement const& element);
struct ThreadState;
static bool RestorePaintPopups(ThreadState& state) noexcept;


// Paint owns an admitted native title. Notepad owns custom tabs and declines
// all public caption access: even the button-only path revived a native title
// over its tabs in a fresh recorded process. No title mode or geometry changes.
static constexpr std::array<unsigned,12> publicCaptionSlots={0,1,2,3,4,5,6,7,8,9,10,11};
static bool CaptionSlotAdmitted(unsigned slot) noexcept {
 return std::find(publicCaptionSlots.begin(),publicCaptionSlots.end(),slot)!=publicCaptionSlots.end();
}
static bool CaptionCompositionAdmitted(bool extended) noexcept {
 return !publicCaptionSlots.empty()&&(false||!extended);
}
using CaptionColor = Windows::Foundation::IReference<Color>;
using PublicTitleBar = Microsoft::UI::Windowing::AppWindowTitleBar;
struct CaptionSlot { CaptionColor before{nullptr}, applied{nullptr}; bool owned=false, changed=false; };
struct PublicCaption {
 HWND window=nullptr; PublicTitleBar bar{nullptr}; std::array<CaptionSlot,12> slots; bool declined=false;
};
static constexpr PCWSTR publicCaptionProperty=L"j3w1-paint-chrome-public-caption-owner";
static thread_local bool publicCaptionWrite=false;
static bool SameCaptionColor(CaptionColor const& a,CaptionColor const& b) {
 return (!a&&!b)||(a&&b&&Same(a.Value(),b.Value()));
}
static bool PublicCaptionWindow(HWND window) noexcept {
 DWORD process=0;auto thread=GetWindowThreadProcessId(window,&process);wchar_t type[64]{};
 return thread==GetCurrentThreadId()&&process==GetCurrentProcessId()&&GetAncestor(window,GA_ROOT)==window
  &&GetClassNameW(window,type,std::size(type))&&wcscmp(type,L"MSPaintApp")==0;
}
static bool OwnsPublicCaptionWindow(PublicCaption const& caption) noexcept {
 // Window properties disappear on destruction. Stable heap identity prevents
 // a reused HWND (including reuse on this UI thread) from inheriting ownership.
 return PublicCaptionWindow(caption.window)&&GetPropW(caption.window,publicCaptionProperty)==&caption;
}
static CaptionColor ReadCaption(PublicTitleBar const& bar,unsigned slot) {
 if(!CaptionSlotAdmitted(slot))throw hresult_invalid_argument();
 switch(slot) {
 case 0:return bar.BackgroundColor();case 1:return bar.ForegroundColor();
 case 2:return bar.ButtonBackgroundColor();case 3:return bar.ButtonForegroundColor();
 case 4:return bar.ButtonHoverBackgroundColor();case 5:return bar.ButtonHoverForegroundColor();
 case 6:return bar.ButtonPressedBackgroundColor();case 7:return bar.ButtonPressedForegroundColor();
 case 8:return bar.InactiveBackgroundColor();case 9:return bar.InactiveForegroundColor();
 case 10:return bar.ButtonInactiveBackgroundColor();case 11:return bar.ButtonInactiveForegroundColor();
 default:throw hresult_invalid_argument();
 }
}
static void WriteCaption(PublicTitleBar const& bar,unsigned slot,CaptionColor const& color) {
 if(!CaptionSlotAdmitted(slot))throw hresult_invalid_argument();
 switch(slot) {
 case 0:bar.BackgroundColor(color);break;case 1:bar.ForegroundColor(color);break;
 case 2:bar.ButtonBackgroundColor(color);break;case 3:bar.ButtonForegroundColor(color);break;
 case 4:bar.ButtonHoverBackgroundColor(color);break;case 5:bar.ButtonHoverForegroundColor(color);break;
 case 6:bar.ButtonPressedBackgroundColor(color);break;case 7:bar.ButtonPressedForegroundColor(color);break;
 case 8:bar.InactiveBackgroundColor(color);break;case 9:bar.InactiveForegroundColor(color);break;
 case 10:bar.ButtonInactiveBackgroundColor(color);break;case 11:bar.ButtonInactiveForegroundColor(color);break;
 default:throw hresult_invalid_argument();
 }
}
static Color CaptionRoleColor(unsigned slot) {
 static constexpr Color colors[]={
  {255,0,0,0}, // BackgroundColor : color.surface.canvas
  {255,233,148,153}, // ForegroundColor : color.text.default
  {255,0,0,0}, // ButtonBackgroundColor : color.surface.canvas
  {255,233,148,153}, // ButtonForegroundColor : color.text.default
  {255,28,10,9}, // ButtonHoverBackgroundColor : color.interaction.hover.bg
  {255,233,148,153}, // ButtonHoverForegroundColor : color.text.default
  {255,66,15,12}, // ButtonPressedBackgroundColor : color.interaction.pressed.bg
  {255,233,148,153}, // ButtonPressedForegroundColor : color.text.default
  {255,0,0,0}, // InactiveBackgroundColor : color.surface.canvas
  {255,189,120,125}, // InactiveForegroundColor : color.text.muted
  {255,0,0,0}, // ButtonInactiveBackgroundColor : color.surface.canvas
  {255,189,120,125}, // ButtonInactiveForegroundColor : color.text.muted
 };
 if(slot>=std::size(colors)||!CaptionSlotAdmitted(slot))throw hresult_invalid_argument();
 return colors[slot];
}
template<class Read,class Write> static bool UpdateCaptionSlot(CaptionSlot& slot,CaptionColor const& value,bool active,Read read,Write write) noexcept {
 auto failed=[&] {
  if(slot.owned)try {
   auto current=read();
   if(SameCaptionColor(current,slot.before))slot.owned=false;
   else if(!SameCaptionColor(current,slot.applied)){slot.owned=false;slot.changed=true;}
  }catch(...){}
  return false;
 };
 try {
  auto current=read();
  if(slot.owned&&!SameCaptionColor(current,slot.applied)){slot.owned=false;slot.changed=true;}
  if(!active) {
   if(slot.owned){write(slot.before);slot.owned=false;}
   return true;
  }
  if(slot.changed||slot.owned)return true;
  slot.before=current;slot.applied=value;slot.owned=true;
  write(value);return true;
 }catch(...){return failed();}
}
struct CaptionWriteGuard {
 bool prior=publicCaptionWrite;
 CaptionWriteGuard(){publicCaptionWrite=true;}
 ~CaptionWriteGuard(){publicCaptionWrite=prior;}
};

struct ThreadState {
std::vector<std::unique_ptr<PublicCaption>> publicCaptions;
#if !J3W1_LEGACY_XAML
 std::vector<std::unique_ptr<WindowBacking>> windowBackings;
 std::vector<PopupBacking> popupBackings; std::vector<PreopenMenuStyle> preopenMenus;
#endif
 ControlResources keyTips; std::deque<ChromeAnimationChange> animations; std::deque<ChromeSetterChange> setters; std::deque<ChromeBaseChange> bases; std::deque<ChromeTransitionChange> transitions; HWND channel=nullptr; WNDPROC original=nullptr; std::deque<Root> roots; std::vector<OwnedNativeBrush> nativeBrushes; std::deque<PaintSplitEdgeReceipt> paintSplitEdges; std::vector<PendingRoot> pending; std::deque<PopupLoadReceipt> popupLoads; bool busy=false,queued=false,cleaning=false; unsigned ticks=0; };
static thread_local ThreadState* uiState=nullptr;
static bool EnsureChannel();
static void Schedule();
// Core-created keyboard badges resolve Application.Resources directly, outside
// the admitted chrome element tree. Only the three documented color keys are
// application scoped. Exactly one UI thread owns these restorable entries.
static std::atomic<DWORD> keyTipOwnerThread{0};
static bool KeyTipResource(std::wstring_view key) {
 return key==L"KeyTipBackground"||key==L"KeyTipBorderBrush"||key==L"KeyTipForeground";
}
static bool ClaimKeyTipOwner(DWORD thread) {
 if(!thread)return false;DWORD expected=0;
 return keyTipOwnerThread.compare_exchange_strong(expected,thread)||expected==thread;
}
static void ReleaseKeyTipOwner(DWORD thread) {
 keyTipOwnerThread.compare_exchange_strong(thread,0);
}
static bool RestoreKeyTips(ThreadState& state) noexcept {
 if(keyTipOwnerThread.load()!=GetCurrentThreadId())return true;
 if(!RestoreControlResources(state.keyTips))return false;
 ReleaseKeyTipOwner(GetCurrentThreadId());return true;
}
static bool ApplyKeyTips(ThreadState& state) noexcept {
 if(!ClaimKeyTipOwner(GetCurrentThreadId()))return true;
 if(state.keyTips.owner)return true;
 try {
  auto app=Factory(L"Microsoft.UI.Xaml.Application").as<IApplicationStatics>().Current();
  if(!app){ReleaseKeyTipOwner(GetCurrentThreadId());return false;}
  state.keyTips.owner=app.Resources();
  for(auto const& rule:rules)if(KeyTipResource(rule.key)) {
   hstring key(rule.key);auto applied=SolidColorBrush(rule.color);
   state.keyTips.keys.push_back({key,nullptr,applied});auto& owned=state.keyTips.keys.back();
   if(!ApplyControlKey(owned,[&]{return LocalResource(state.keyTips.owner,key);},
      [&](auto const& value){state.keyTips.owner.Insert(box_value(key),value);}))throw hresult_error(E_FAIL);
  }
  return true;
 }catch(...) {RestoreKeyTips(state);return false;}
}
static std::atomic<bool> enabled{false},factoryReady{false},contentReady{false},windowFactoryReady{false},windowContentReady{false};
static UINT dispatchMessage=0;
static constexpr UINT_PTR timerId=0x4a334953;
static HANDLE stopDiscovery=nullptr;
static HANDLE discovery=nullptr;
[[clang::no_destroy]] static std::mutex channelMutex;
[[clang::no_destroy]] static std::vector<HWND> channels;
static Color CanvasColor(){for(auto const& rule:rules)if(wcscmp(rule.key,L"SolidBackgroundFillColorBaseBrush")==0)return rule.color;throw hresult_error(E_INVALIDARG);}

static std::vector<ResourceDictionary> Dictionaries(ResourceDictionary const& root) {
 std::vector<ResourceDictionary> result,queue{root};
 for(unsigned at=0;at<queue.size();at++) {
  if(at>=32)throw hresult_error(E_INVALIDARG);
  auto dict=queue[at];bool found=false;
  for(auto const& prior:result)if(Identity(dict,prior)){found=true;break;}
  if(found)continue;result.push_back(dict);
  for(auto theme:{L"Default",L"Dark"})if(auto child=dict.ThemeDictionaries().TryLookup(box_value(theme)).try_as<ResourceDictionary>())queue.push_back(child);
  auto merged=dict.MergedDictionaries();if(merged.Size()>16)throw hresult_error(E_INVALIDARG);
  for(auto child:merged)queue.push_back(child);
 }
 return result;
}
enum class Kind { Background,Foreground,Border,FocusPrimary,FocusSecondary,ToggleOnFill,ToggleOnStroke,Separator };
static bool Matches(Rule const& rule,Kind kind) {
 if(kind==Kind::Separator)return wcscmp(rule.role,L"color.border.divider")==0;
 if(kind==Kind::ToggleOnFill)return wcsncmp(rule.key,L"ToggleSwitchKnobFillOn",22)==0;
 if(kind==Kind::ToggleOnStroke)return wcsncmp(rule.key,L"ToggleSwitchStrokeOn",20)==0;
 if(kind==Kind::FocusPrimary)return wcscmp(rule.key,L"SystemControlFocusVisualPrimaryBrush")==0;
 if(kind==Kind::FocusSecondary)return wcscmp(rule.key,L"SystemControlFocusVisualSecondaryBrush")==0;
 if(wcsstr(rule.key,L"FocusVisual"))return false;
 if(kind==Kind::Foreground)return wcsncmp(rule.role,L"color.text.",11)==0;
 if(kind==Kind::Border)return wcsncmp(rule.role,L"color.border.",13)==0;
 return wcsncmp(rule.role,L"color.surface.",14)==0||wcsstr(rule.role,L".bg")!=nullptr;
}
static void RefreshThemeResources(Root& root) {
 auto element=root.element.get();if(!element)return;
 auto property=FrameworkElement::RequestedThemeProperty();
 if(!root.themeTouched) {
  auto local=element.ReadLocalValue(property);
  if(local&&!Identity(local,DependencyProperty::UnsetValue())&&!local.try_as<Windows::Foundation::IReference<ElementTheme>>())throw hresult_invalid_argument();
  root.themeBefore=local;root.themeTouched=true;
 }
 auto restore=[&]{
  if(!root.themeBefore||Identity(root.themeBefore,DependencyProperty::UnsetValue()))element.ClearValue(property);
  else element.SetValue(property,root.themeBefore);
  root.themeTouched=false;root.themeBefore=nullptr;
 };
 try {element.RequestedTheme(element.ActualTheme()==ElementTheme::Dark?ElementTheme::Light:ElementTheme::Dark);restore();}
 catch(...) {try{restore();}catch(...){}throw;}
}
// A weak host reference can still resolve after IClosable::Close. On the
// reviewed runtime, Close clears the public SiteBridge and the internal island;
// SystemBackdrop then dereferences that disposed island. Probe only the safe
// public bridge getter before any backdrop access, on the existing UI thread.
template<class Source,class Visit> static bool WithAttachedSource(Source const& source,Visit visit) {
 if(!source||!source.SiteBridge())return false;
 visit(source);return true;
}
static bool Restore(Root& root) {
 bool restored=true;
 for(auto& entry:root.controls)restored=RestoreControlResources(entry)&&restored;
 for(auto& entry:root.refreshes)restored=RestoreThemeRefresh(entry)&&restored;
 if(root.themeTouched)try{RefreshThemeResources(root);}catch(...){restored=false;}
 auto element=root.backgroundElement.get();
 bool backgroundOwned=false;
 try{backgroundOwned=element&&root.backgroundApplied&&Identity(element.GetValue(root.backgroundProperty),root.backgroundApplied);}catch(...){restored=false;}
#if !J3W1_LEGACY_XAML
 if(root.backdropTracked)try {
  WithAttachedSource(root.source.get(),[&](auto const& source){
   if(!source.SystemBackdrop())source.SystemBackdrop(root.backdropBefore);
  });
  if(auto window=root.window.get();window&&!window.SystemBackdrop())window.SystemBackdrop(root.backdropBefore);
  root.backdropTracked=false;root.backdropBefore=nullptr;
 }catch(...){restored=false;}
#endif
 if(root.owner&&root.overlay)try {
  auto merged=root.owner.MergedDictionaries();unsigned index=0;
  if(merged.IndexOf(root.overlay,index))merged.RemoveAt(index);
  root.overlay=nullptr;root.owner=nullptr;
  for(auto& entry:root.controls){entry.refresh.complete=false;restored=RefreshThemeSource(entry.refresh)&&restored;}
  // Reevaluate the same bounded chrome controls after removing our overlay.
  for(auto& entry:root.refreshes){entry.complete=false;if(!RefreshThemeSource(entry))restored=false;}

 }catch(...){restored=false;}
 for(auto it=root.changes.rbegin();it!=root.changes.rend();++it)try {
  if(auto object=it->object.get();object&&Identity(object.GetValue(it->property),it->applied)) {
   if(!it->before||Identity(it->before,DependencyProperty::UnsetValue()))object.ClearValue(it->property);
   else object.SetValue(it->property,it->before);
  }
 }catch(...){restored=false;}
 if(backgroundOwned)try {
  if(!root.backgroundBefore||Identity(root.backgroundBefore,DependencyProperty::UnsetValue()))element.ClearValue(root.backgroundProperty);
  else element.SetValue(root.backgroundProperty,root.backgroundBefore);
 }catch(...){restored=false;}
 if(restored){root.changes.clear();root.controls.clear();root.palette.clear();root.backgroundProperty=nullptr;root.backgroundBefore=nullptr;root.backgroundApplied=nullptr;root.backgroundElement={};}
 Log(70,restored);return restored;
}

// Public backdrop access is read/write. Retain the exact object, and restore
// only while our null remains installed; a later app-owned backdrop wins.
static void ApplyBackdrop(Root& root) {
#if !J3W1_LEGACY_XAML
 // The window composition backing has its own readable baseline. Do not
 // clear its XAML backdrop controller through a second resource-root owner.
 if(false&&uiState)if(auto window=root.window.get())
  for(auto const& entry:uiState->windowBackings)if(OwnsWindowBacking(*entry)&&Identity(window,entry->target))return;
 if(root.backdropTracked)return;
 if(auto source=root.source.get()) {
  WithAttachedSource(source,[&](auto const& attached){
   if(auto value=attached.SystemBackdrop()) {root.backdropBefore=value;attached.SystemBackdrop(nullptr);root.backdropTracked=true;}
  });
 } else if(auto window=root.window.get()) {
  if(auto value=window.SystemBackdrop()) {root.backdropBefore=value;window.SystemBackdrop(nullptr);root.backdropTracked=true;}
 }
#endif
}

// The inspected islands wrap their app-owned content in a scrolling viewport.
// Its background is outside the content subtree. Admit only those wrappers in
// the same XamlRoot, and retain the exact local background for restoration.
static bool ChromeWrapperClass(std::wstring_view name) {
 return name==L"Microsoft.UI.Xaml.Controls.Border"
     ||name==L"Microsoft.UI.Xaml.Controls.ScrollContentPresenter"
     ||name==L"Microsoft.UI.Xaml.Controls.ScrollViewer";
}
static FrameworkElement ChromeBackgroundBoundary(FrameworkElement const& content) {
 auto result=content;auto xaml=content.XamlRoot();if(!xaml)return result;
 for(unsigned depth=0;depth<16;depth++) {
  auto parent=VisualTreeHelper::GetParent(result).try_as<FrameworkElement>();
  if(!parent||!ChromeWrapperClass(std::wstring_view{get_class_name(parent)})||!Identity(parent.XamlRoot(),xaml))break;
  result=parent;
 }
 return result;
}
// Paint's AppChrome is a UserControl whose Content getter does not expose its
// rendered child Grid. Its transparent template relies on the native backdrop.
// Admit only that direct same-root Grid; painting beneath artwork preserves it.
static bool PaintBackingAdmission(std::wstring_view owner,std::wstring_view child,unsigned count,bool sameRoot) noexcept {
 return owner==L"PaintUI.AppChrome"&&child==L"Microsoft.UI.Xaml.Controls.Grid"&&count==1&&sameRoot;
}
static bool NotepadSettingsBackingAdmission(std::wstring_view owner,std::wstring_view child,std::wstring_view name,unsigned count,bool sameRoot) noexcept {
 return owner==L"NotepadXamlUI.NotepadSettingsPage"&&child==L"Microsoft.UI.Xaml.Controls.ScrollViewer"
  &&name==L"RootScrollViewer"&&count==1&&sameRoot;
}
static void ApplyRootBackground(Root& root) {
 auto element=root.element.get();if(!element)return;
 // Select the app's rendered backing before walking outward into scroll
 // wrappers. Paint's outer ScrollViewer does not consume its own Background.
 bool paintBacking=false;
 if(get_class_name(element)==L"PaintUI.AppChrome"&&VisualTreeHelper::GetChildrenCount(element)==1) {
  auto child=VisualTreeHelper::GetChild(element,0).try_as<Grid>();
  if(child&&PaintBackingAdmission(std::wstring_view{get_class_name(element)},std::wstring_view{get_class_name(child)},1,Identity(element.XamlRoot(),child.XamlRoot()))){element=child;paintBacking=true;}
 }
 // Select Notepad's real Settings viewport before the outer scrolling island
 // wrapper, whose Background is not consumed by the app's inner template.
 bool settingsBacking=false;
 if(get_class_name(element)==L"NotepadXamlUI.NotepadSettingsPage"&&VisualTreeHelper::GetChildrenCount(element)==1) {
  auto child=VisualTreeHelper::GetChild(element,0).try_as<ScrollViewer>();
  if(child&&NotepadSettingsBackingAdmission(std::wstring_view{get_class_name(element)},std::wstring_view{get_class_name(child)},std::wstring_view{child.Name()},1,Identity(element.XamlRoot(),child.XamlRoot()))) {element=child;settingsBacking=true;}
 }
 if(!paintBacking&&!settingsBacking) {
  auto boundary=ChromeBackgroundBoundary(element);
  if(!Identity(boundary,element))element=boundary;
  // Only the immediate content panel of an admitted root, never all panels.
  if(auto control=element.try_as<UserControl>())if(auto panel=control.Content().try_as<Panel>())element=panel;
 }
 if(root.backgroundProperty)element=root.backgroundElement.get();
 if(!element)return;
 if(!root.backgroundProperty) {
  if(element.try_as<Panel>())root.backgroundProperty=Panel::BackgroundProperty();
  else if(element.try_as<Control>())root.backgroundProperty=Control::BackgroundProperty();
  else if(element.try_as<Border>())root.backgroundProperty=Border::BackgroundProperty();
  else {Log(181);return;}
  root.backgroundElement=make_weak(element);
 }
 if(!root.backgroundApplied)root.backgroundApplied=SolidColorBrush(CanvasColor());
 if(Identity(element.GetValue(root.backgroundProperty),root.backgroundApplied))return;
 auto before=element.ReadLocalValue(root.backgroundProperty);
 if(before&&!Identity(before,DependencyProperty::UnsetValue())&&!before.try_as<Brush>()){Log(182);return;}
 Log(183,element.try_as<Panel>()?1:element.try_as<Control>()?2:3);
 root.backgroundBefore=before;
 element.SetValue(root.backgroundProperty,root.backgroundApplied);
}
static bool Prepare(Root& root) {
 if(!root.palette.empty())return true;
 if(!root.changes.empty())if(!Restore(root))return false;
 auto element=root.element.get();if(!element||!element.IsLoaded()||element.ActualWidth()<=0||element.ActualHeight()<=0)return false;
 auto app=Factory(L"Microsoft.UI.Xaml.Application").as<IApplicationStatics>().Current();if(!app)return false;
 auto sources=Dictionaries(app.Resources());
 auto locals=Dictionaries(element.Resources());sources.insert(sources.end(),locals.begin(),locals.end());
 std::vector<Palette> pending;
 for(auto const& rule:rules) {
  Palette item{&rule,SolidColorBrush(rule.color),{}};
  for(auto const& dict:sources) {
   auto brush=dict.TryLookup(box_value(rule.key)).try_as<Brush>();if(!brush)continue;
   bool duplicate=false;for(auto const& prior:item.aliases)if(Identity(brush,prior)){duplicate=true;break;}
   if(!duplicate)item.aliases.push_back(brush);
  }
  pending.push_back(std::move(item));
 }
 root.palette=std::move(pending);
 root.owner=element.Resources();root.overlay=ResourceDictionary();
 for(auto const& item:root.palette)root.overlay.Insert(box_value(item.rule->key),item.applied);
 root.owner.MergedDictionaries().Append(root.overlay);
 ApplyRootBackground(root);
 Log(20,static_cast<unsigned>(root.palette.size()));return true;
}
static bool DataSubtree(DependencyObject const& object) {
 auto type=get_class_name(object);
 if(type==L"Microsoft.Terminal.Control.TermControl"||type==L"TerminalApp.TerminalPage"
   ||type==L"TerminalApp.CommandPalette"||type==L"TerminalApp.SuggestionsControl")return true;
 std::wstring_view name{type};
 if(name.find(L"ColorPicker")!=std::wstring_view::npos||name.find(L"CanvasControl")!=std::wstring_view::npos||name.find(L"InkCanvas")!=std::wstring_view::npos
   ||name==L"PaintUI.D2DSwapChainPanel"||name==L"PaintUI.ColorRadioButton"||name==L"PaintUI.ItemHoverGridView")return true;
 // Shape, image and document content properties are never visited or rewritten.
 return false;
}
static Kind TemplateKind(DependencyObject const& object,Kind fallback) {
 if(fallback==Kind::Background) {
  auto ancestor=object;
  for(unsigned depth=0;ancestor&&depth<5;depth++,ancestor=VisualTreeHelper::GetParent(ancestor))
   if(ancestor.try_as<MenuFlyoutSeparator>())return Kind::Separator;
 }
 auto element=object.try_as<FrameworkElement>();if(!element)return fallback;
 auto name=element.Name();
 bool knobOn=name==L"SwitchKnobOn";
 bool knobOff=name==L"SwitchKnobOff";
 bool bounds=name==L"SwitchKnobBounds";
 if(!knobOn&&!knobOff&&!bounds)return fallback;
 auto parent=VisualTreeHelper::GetParent(object);
 for(unsigned depth=0;parent&&depth<12;depth++,parent=VisualTreeHelper::GetParent(parent)) {
  if(parent.try_as<ToggleSwitch>()) {
   if(knobOn&&fallback==Kind::Background)return Kind::ToggleOnFill;
   if(knobOff&&fallback==Kind::Background)return Kind::Foreground;
   if(bounds&&fallback==Kind::Border)return Kind::ToggleOnStroke;
   break;
  }
 }
 return fallback;
}

// These exact-package template backgrounds are local brushes, not aliases of
// public theme resources. Admission requires the observed class, parent and
// neutral ARGB together; data and artwork subtrees stay excluded.
static const wchar_t* PaintChromeKey(std::wstring_view type,std::wstring_view owner,Kind kind,Color c) {
 if(kind==Kind::Background&&Same(c,{76,58,58,58})) {
  if((type==L"PaintUI.Ribbon"&&owner==L"Microsoft.UI.Xaml.Controls.StackPanel")
    ||(type==L"PaintUI.RibbonControl"&&owner==L"PaintUI.Ribbon")
    ||(type==L"Microsoft.UI.Xaml.Controls.Grid"&&(owner==L"PaintUI.RibbonControl"||owner==L"PaintUI.LayersPanel")))
   return L"SolidBackgroundFillColorBaseBrush";
 }
 if(kind==Kind::Border) {
  if(type==L"PaintUI.RibbonControl"&&owner==L"PaintUI.Ribbon"&&Same(c,{255,28,28,28}))return L"DividerStrokeColorDefaultBrush";
  if((type==L"PaintUI.RibbonGroup"||type==L"PaintUI.RibbonCollapsibleGroup")&&owner==L"PaintUI.RibbonPanel"&&Same(c,{21,255,255,255}))return L"DividerStrokeColorDefaultBrush";
 }
 return nullptr;
}

// These noninteractive slider backings are acrylic, not solid resource
// aliases. Require the observed exact-package template identity and tint.
static const wchar_t* PaintSliderBackingKey(std::wstring_view type,std::wstring_view owner,Kind kind,Color tint) {
 if(kind!=Kind::Background||type!=L"Microsoft.UI.Xaml.Controls.Grid"||!Same(tint,{255,44,44,44}))return nullptr;
 return owner==L"PaintUI.BrushSizeSlider"||owner==L"PaintUI.PercentageSlider"?L"SolidBackgroundFillColorBaseBrush":nullptr;
}

static const wchar_t* NotepadTabNeutralKey(bool tabsRoot,std::wstring_view type,std::wstring_view owner,Color c,bool tabItem) {
 if(!tabsRoot||(type!=L"Microsoft.UI.Xaml.Controls.Grid"&&type!=L"Microsoft.UI.Xaml.Shapes.Path")
   ||owner!=L"Microsoft.UI.Xaml.Controls.Grid"||!Same(c,{115,58,58,58}))return nullptr;
 return tabItem?L"TabViewItemHeaderBackgroundSelected":L"SolidBackgroundFillColorBaseBrush";
}
static const wchar_t* NotepadToolbarSurfaceKey(std::wstring_view root,std::wstring_view type,std::wstring_view parent,Kind kind,Color color) {
 return kind==Kind::Background&&root==L"NotepadXamlUI.MainMenuBar"
  &&type==L"Microsoft.UI.Xaml.Controls.Grid"&&parent==L"NotepadXamlUI.MainMenuBar"
  &&Same(color,{115,58,58,58})?L"SolidBackgroundFillColorBaseBrush":nullptr;
}
// Only the observed noninteractive Settings-card backing is local paint.
// Expander headers and their state-controlled children use resource overrides.
static const wchar_t* NotepadSettingsSurfaceKey(std::wstring_view root,std::wstring_view type,std::wstring_view parent,std::wstring_view grandparent,Kind kind,Color color) {
 if(root!=L"NotepadXamlUI.NotepadSettingsPage"||kind!=Kind::Background||!Same(color,{13,255,255,255}))return nullptr;
 bool panel=type==L"NotepadXamlUI.ExpanderExQuadratePanel"&&parent==L"Microsoft.UI.Xaml.Controls.Grid"&&grandparent==L"NotepadXamlUI.ExpanderEx";
 bool backing=type==L"Microsoft.UI.Xaml.Controls.Grid"&&parent==L"NotepadXamlUI.ExpanderExQuadratePanel"&&grandparent==L"Microsoft.UI.Xaml.Controls.Grid";
 return panel||backing?L"CardBackgroundFillColorDefaultBrush":nullptr;
}
static const wchar_t* NativeFocusBrushKey(Kind kind,bool control) {
 if(!control)return nullptr;
 return kind==Kind::FocusPrimary?L"SystemControlFocusVisualPrimaryBrush":kind==Kind::FocusSecondary?L"SystemControlFocusVisualSecondaryBrush":nullptr;
}
// A SplitButton's parent properties feed the resting TemplateBindings of its
// main/dropdown halves. Resource overrides alone leave an already-resolved
// parent brush native. Only this framework control's stable brush properties
// are admitted; its template, states, nested content and commands remain native.
static const wchar_t* SplitButtonTemplateBindingKey(std::wstring_view type,Kind kind) noexcept {
 if(type!=L"Microsoft.UI.Xaml.Controls.SplitButton"&&type!=L"Windows.UI.Xaml.Controls.SplitButton")return nullptr;
 return kind==Kind::Background?L"SplitButtonBackground":kind==Kind::Foreground?L"SplitButtonForeground":kind==Kind::Border?L"SplitButtonBorderBrush":nullptr;
}
static Palette const* TemplateSurface(Root const& root,DependencyObject const& object,Kind kind,Brush const& brush) {

 if(auto key=SplitButtonTemplateBindingKey(std::wstring_view{get_class_name(object)},kind)) {
  for(auto const& item:root.palette)if(wcscmp(item.rule->key,key)==0)return &item;
  return nullptr;
 }

 if(auto key=NativeFocusBrushKey(kind,object.try_as<Control>()!=nullptr)) {
  for(auto const& item:root.palette)if(wcscmp(item.rule->key,key)==0)return &item;
  return nullptr;
 }
 if(kind!=Kind::Background&&kind!=Kind::Border)return nullptr;
 auto parent=VisualTreeHelper::GetParent(object);if(!parent)return nullptr;
 auto type=get_class_name(object),owner=get_class_name(parent);
 if(auto acrylic=brush.try_as<AcrylicBrush>()) {
  auto key=PaintSliderBackingKey(std::wstring_view{type},std::wstring_view{owner},kind,acrylic.TintColor());
  if(key)for(auto const& item:root.palette)if(wcscmp(item.rule->key,key)==0)return &item;
  return nullptr;
 }
 auto solid=brush.try_as<SolidColorBrush>();if(!solid)return nullptr;
 auto c=solid.Color();
const wchar_t* key=PaintChromeKey(std::wstring_view{type},std::wstring_view{owner},kind,c);
 // Observed on a fresh exact-package window: this immediate template Grid
 // paints the whole toolbar independently of MainMenuBar.Background.
 if(auto mapped=NotepadToolbarSurfaceKey(std::wstring_view{get_class_name(root.element.get())},std::wstring_view{type},std::wstring_view{owner},kind,c))key=mapped;

 if(auto ancestor=VisualTreeHelper::GetParent(parent))if(auto mapped=NotepadSettingsSurfaceKey(std::wstring_view{get_class_name(root.element.get())},std::wstring_view{type},std::wstring_view{owner},std::wstring_view{get_class_name(ancestor)},kind,c))key=mapped;
 if(kind==Kind::Border) {
  if(key)for(auto const& item:root.palette)if(wcscmp(item.rule->key,key)==0)return &item;
  return nullptr;
 }
 if(auto element=root.element.get();element&&get_class_name(element)==L"NotepadXamlUI.StatusBar"
   &&type==L"Microsoft.UI.Xaml.Shapes.Rectangle"&&owner==L"Microsoft.UI.Xaml.Controls.Grid"
   &&Same(c,{21,255,255,255}))key=L"DividerStrokeColorDefaultBrush";
 // The exact Notepad status template adds a translucent neutral disabled fill
 // below its read-only labels, independently of the root's own background.
 if(auto element=root.element.get();element&&get_class_name(element)==L"NotepadXamlUI.StatusBar"
   &&type==L"Microsoft.UI.Xaml.Controls.Grid"&&owner==L"Microsoft.UI.Xaml.Controls.Grid"
   &&Same(c,{115,58,58,58}))key=L"SolidBackgroundFillColorBaseBrush";
 // The selected tab has two locally constructed template fills. Scope both
 // to the exact TabsBarItem ancestry rather than matching neutral colors
 // elsewhere in the application's visual tree.
 if(auto element=root.element.get();element&&get_class_name(element)==L"NotepadXamlUI.TabsBar"
   &&(type==L"Microsoft.UI.Xaml.Controls.Grid"||type==L"Microsoft.UI.Xaml.Shapes.Path")
   &&owner==L"Microsoft.UI.Xaml.Controls.Grid"&&Same(c,{115,58,58,58})) {
  auto item=VisualTreeHelper::GetParent(parent);
  key=NotepadTabNeutralKey(true,std::wstring_view{type},std::wstring_view{owner},c,item&&get_class_name(item)==L"NotepadXamlUI.TabsBarItem");
 }
 if(type==L"Microsoft.UI.Xaml.Controls.ScrollViewer" && owner==L"NotepadXamlUI.ScrollBar"
   && Same(c,{255,39,39,39}))key=L"SolidBackgroundFillColorBaseBrush";
 if(type==L"Microsoft.UI.Xaml.Controls.Border" && owner==L"Microsoft.UI.Xaml.Controls.Primitives.Thumb"
   && Same(c,{255,69,69,69}))key=L"J3w1ScrollBarThumb";
 if(type==L"Microsoft.UI.Xaml.Controls.Primitives.RepeatButton" && owner==L"Microsoft.UI.Xaml.Controls.Grid"
   && Same(c,{255,69,69,69})) {
  auto ancestor=parent;
  for(unsigned depth=0;ancestor&&depth<8;depth++,ancestor=VisualTreeHelper::GetParent(ancestor))
   if(ancestor.try_as<Microsoft::UI::Xaml::Controls::Primitives::ScrollBar>()){key=L"SolidBackgroundFillColorBaseBrush";break;}
 }
 if(key)for(auto const& item:root.palette)if(wcscmp(item.rule->key,key)==0)return &item;
 return nullptr;
}

// Collect brush identities beneath excluded data controls before any write.
// Their RGB values are never used for admission or logged. Reaching the walk
// bound refuses this root instead of guessing that the rest contains no data.
static bool ProtectedBrushes(Root const& root,std::vector<Brush>& brushes) {
 struct Visit{DependencyObject object;bool data;};
 std::vector<Visit> todo;
 if(auto element=root.element.get())todo.push_back({element,false});
 auto retain=[&](DependencyObject const& object,DependencyProperty const& property){
  if(auto brush=object.GetValue(property).try_as<Brush>())brushes.push_back(brush);
 };
 unsigned count=0;
 while(!todo.empty()) {
  if(++count>4096)return false;
  auto visit=todo.back();todo.pop_back();auto object=visit.object;
  bool data=visit.data||DataSubtree(object);
  if(data) {
   if(object.try_as<Control>()){retain(object,Control::BackgroundProperty());retain(object,Control::ForegroundProperty());retain(object,Control::BorderBrushProperty());}
   if(object.try_as<Panel>())retain(object,Panel::BackgroundProperty());
   if(object.try_as<Border>()){retain(object,Border::BackgroundProperty());retain(object,Border::BorderBrushProperty());}
   if(object.try_as<Microsoft::UI::Xaml::Shapes::Shape>()){retain(object,Microsoft::UI::Xaml::Shapes::Shape::FillProperty());retain(object,Microsoft::UI::Xaml::Shapes::Shape::StrokeProperty());}
  }
  for(int i=0;i<VisualTreeHelper::GetChildrenCount(object);i++)todo.push_back({VisualTreeHelper::GetChild(object,i),data});
 }
 return true;
}

// Retired popup controls no longer need overrides, but their resource dictionary
// can outlive the element. Return its exact owned resources before releasing a
// receipt; a failed restore keeps the receipt for the existing cleanup retry.
template<class RestoreEntry> static bool PruneRetiredControls(Root& root,RestoreEntry restore) {
 for(auto it=root.controls.begin();it!=root.controls.end();) {
  if(it->element.get()){++it;continue;}
  if(!restore(*it))return false;
  it=root.controls.erase(it);
 }
 return true;
}
static bool PruneRetiredControls(Root& root) {
 return PruneRetiredControls(root,[](ControlResources& entry){return RestoreControlResources(entry);});
}

// SplitButton owns the state backgrounds above its two ButtonBase children.
// Override its own resource scope while keeping the native state setters.
static bool CompositeButtonChrome(std::wstring_view type) {
 return type==L"Microsoft.UI.Xaml.Controls.SplitButton"||type==L"Windows.UI.Xaml.Controls.SplitButton";
}
// The viewport scrollbar is chrome, separate from the excluded drawing surface.
// Use its native resource/state contract; never replace its template or value.
static bool NativeScrollbarChrome(std::wstring_view type) noexcept {
 return type==L"Microsoft.UI.Xaml.Controls.Primitives.ScrollBar"
  ||type==L"Windows.UI.Xaml.Controls.Primitives.ScrollBar";
}
static bool StandardChrome(DependencyObject const& object) {
 return NativeScrollbarChrome(std::wstring_view{get_class_name(object)})
  ||CompositeButtonChrome(std::wstring_view{get_class_name(object)})
  ||object.try_as<Microsoft::UI::Xaml::Controls::Primitives::ButtonBase>()
  ||object.try_as<MenuBarItem>()||object.try_as<MenuFlyoutItem>()||object.try_as<MenuFlyoutSubItem>()
  ||object.try_as<MenuFlyoutPresenter>()||object.try_as<FlyoutPresenter>()||object.try_as<ToolTip>()||object.try_as<ToggleSwitch>()||object.try_as<ComboBox>()
  ||object.try_as<ListViewItem>()
#if !J3W1_LEGACY_XAML
  ||object.try_as<Expander>()
#endif
  ||object.try_as<Slider>()||object.try_as<TextBlock>()||object.try_as<IconElement>();
}
static void RefreshChromeControl(Root& root,DependencyObject const& object) {
 if(!StandardChrome(object))return;
 auto element=object.try_as<FrameworkElement>();if(!element||!element.IsLoaded())return;
 // Popup controls share an island with several admitted chrome roots. Their
 // resources need one owner so restoration cannot retain another root's overlay.
 if(uiState)for(auto& owner:uiState->roots)for(auto& entry:owner.controls)
  if(Identity(entry.element.get(),element)){if(!entry.refresh.complete)RefreshThemeSource(entry.refresh);return;}
 if(root.controls.size()>=1024&&!PruneRetiredControls(root))throw hresult_error(E_FAIL);
 if(root.controls.size()>=1024)return;
 root.controls.push_back({make_weak(element),element.Resources(),{}, {make_weak(element)}});
 auto& entry=root.controls.back();
 for(auto const& item:root.palette) {
  auto key=hstring(item.rule->key);
  // Own resource entries, never frozen shared brushes or local control paint
  // values. The native templates keep control of all visual-state transitions.
  entry.keys.push_back({key,nullptr,item.applied});
  auto& owned=entry.keys.back();
  if(!ApplyControlKey(owned,[&]{return LocalResource(entry.owner,key);},
    [&](auto const& value){entry.owner.Insert(box_value(key),value);}))throw hresult_error(E_FAIL);
 }
 if(!RefreshThemeSource(entry.refresh))Log(235);
 Log(236,static_cast<unsigned>(entry.keys.size()));
}

static bool PopupChromeClass(std::wstring_view type) noexcept;
static bool PopupDiscoveryAdmission(std::wstring_view type,bool uiThread,bool active,bool loaded,bool sameRoot) noexcept;
static void Bridge(Root& root,FrameworkElement const& popup=nullptr) {
 // An immediate popup pass visits only the discovered chrome subtree. Keep
 // the same loaded, UI-thread and root-identity boundary as discovery; this
 // entry point cannot grant admission to document or drawing content.
 if(popup) {
  auto owner=root.element.get();
  if(!owner||!PopupDiscoveryAdmission(std::wstring_view{get_class_name(popup)},ChromeUiThread(popup),
    enabled.load()&&!HighContrast(),popup.IsLoaded(),Identity(owner.XamlRoot(),popup.XamlRoot())))return;
 }
 if(!PruneRetiredControls(root))throw hresult_error(E_FAIL);
 std::vector<Brush> protectedBrushes;if(!ProtectedBrushes(root,protectedBrushes))return;
 auto apply=[&](DependencyObject const& object,DependencyProperty const& property,Kind kind) {
  kind=TemplateKind(object,kind);
  auto brush=object.GetValue(property).try_as<Brush>();
  if(Identity(object,root.element.get())&&Identity(brush,root.backgroundApplied))return;
  if(Identity(object,root.element.get())&&kind==Kind::Background&&uiState&&uiState->ticks<3) {
   Log(100,brush!=nullptr);
   if(auto solid=brush.try_as<SolidColorBrush>()){auto color=solid.Color();Log(101,color.A,RGB(color.R,color.G,color.B));}
  }
  if(!brush)return;
  for(auto const& data:protectedBrushes)if(Identity(brush,data))return;


  if(!uiState)return;
  if(ApplyPaintSplitEdge(uiState->paintSplitEdges,object,property,brush,protectedBrushes))return;
  Palette const* match=TemplateSurface(root,object,kind,brush);
  if(!match)for(auto const& item:root.palette) {
   if(!Matches(*item.rule,kind))continue;
   bool alias=false;for(auto const& candidate:item.aliases)if(Identity(brush,candidate)){alias=true;break;}
   if(!alias)continue;
   if(match&&!Same(match->rule->color,item.rule->color))return;
   match=&item;
  }
  if(!match)return;
  for(auto const& data:protectedBrushes)if(Identity(brush,data))return;
  HRESULT failure=S_OK;
  // Shared theme brushes may be frozen. Direct control resources are the
  // supported override path; do not repeatedly attempt a denied brush write.
  (void)failure;
  // Only the already identified, static exact-package template surfaces use
  // an owned local brush. State-controlled control values remain untouched.
  if(!TemplateSurface(root,object,kind,brush))return;
  auto local=object.ReadLocalValue(property);
  if(local&&!Identity(local,DependencyProperty::UnsetValue())&&!local.try_as<Brush>())return;
  for(auto& prior:root.changes)if(Identity(prior.object.get(),object)&&Identity(prior.property,property)) {
   if(Identity(object.GetValue(property),prior.applied))return;
   // An app update owns the property after the adapter's initial write.
   return;
  }
  root.changes.push_back({make_weak(object),property,local,match->applied});
  object.SetValue(property,match->applied);

 };
 std::vector<DependencyObject> stack;
 if(popup)stack.push_back(popup);
 else if(auto element=root.element.get()) {
  stack.push_back(element);
  // Popup presenters are hosted outside their owner's visual subtree. Visit
  // only popups belonging to this already-admitted XamlRoot, keeping the
  // same data exclusions, brush identity matching and restoration ownership.
  if(auto xaml=element.XamlRoot()) {
   unsigned count=0;
   for(auto const& popup:VisualTreeHelper::GetOpenPopupsForXamlRoot(xaml)) {
    if(++count>64)break;
    if(auto child=popup.Child())stack.push_back(child);
   }
  }
 }
 unsigned count=0;
 while(!stack.empty()&&count++<4096) {
  auto object=stack.back();stack.pop_back();if(DataSubtree(object))continue;
  RefreshChromeControl(root,object);
  if(auto element=object.try_as<FrameworkElement>()){PreparePaintMenuStyle(root,element);ApplyPopupBacking(root,element);}
  if(uiState)ApplyChromeAnimationPalette(object,uiState->animations,uiState->setters,uiState->bases,uiState->transitions);
  if(object.try_as<Control>()) {
   apply(object,Control::BackgroundProperty(),Kind::Background);apply(object,Control::ForegroundProperty(),Kind::Foreground);apply(object,Control::BorderBrushProperty(),Kind::Border);
  }
  if(object.try_as<ContentPresenter>()) {
   apply(object,ContentPresenter::BackgroundProperty(),Kind::Background);apply(object,ContentPresenter::ForegroundProperty(),Kind::Foreground);apply(object,ContentPresenter::BorderBrushProperty(),Kind::Border);
  }
  if(object.try_as<Border>()){apply(object,Border::BackgroundProperty(),Kind::Background);apply(object,Border::BorderBrushProperty(),Kind::Border);}
  if(object.try_as<Panel>())apply(object,Panel::BackgroundProperty(),Kind::Background);
  if(object.try_as<TextBlock>())apply(object,TextBlock::ForegroundProperty(),Kind::Foreground);
  if(object.try_as<IconElement>())apply(object,IconElement::ForegroundProperty(),Kind::Foreground);
  if(object.try_as<Microsoft::UI::Xaml::Shapes::Shape>()) {
   apply(object,Microsoft::UI::Xaml::Shapes::Shape::FillProperty(),Kind::Background);
   apply(object,Microsoft::UI::Xaml::Shapes::Shape::StrokeProperty(),Kind::Border);
  }
  if(object.try_as<FrameworkElement>()) {
   apply(object,FrameworkElement::FocusVisualPrimaryBrushProperty(),Kind::FocusPrimary);apply(object,FrameworkElement::FocusVisualSecondaryBrushProperty(),Kind::FocusSecondary);
  }
  for(int i=0;i<VisualTreeHelper::GetChildrenCount(object);i++)stack.push_back(VisualTreeHelper::GetChild(object,i));
 }
 if(uiState&&uiState->ticks<3)Log(21,count,static_cast<unsigned>(root.changes.size()));
}
static bool RootCandidateClass(std::wstring_view name);
// The window content can be a document/page outside the admitted chrome scope.
// A deferred island must retain its discovered chrome root instead of widening
// admission to that content or dropping the pending root as successfully handled.
template<typename Element,typename Name,typename Parent,typename SameRoot>
static Element SelectChromeRoot(Element const& element,Element const& content,Element const& empty,Name name,Parent parent,SameRoot sameRoot) {
 if(!element||!RootCandidateClass(name(element)))return empty;
 if(content&&sameRoot(content)&&RootCandidateClass(name(content)))return content;
 auto admitted=element;auto ancestor=parent(element);
 for(unsigned depth=0;ancestor&&depth<32;++depth,ancestor=parent(ancestor)) {
  if(!sameRoot(ancestor))break;
  if(RootCandidateClass(name(ancestor)))admitted=ancestor;
 }
 return admitted;
}
static void ObserveRoot(FrameworkElement const& element);
static void Track(UIElement const& content,DesktopWindowXamlSource const& source,Window const& window=nullptr);
static bool RestorePopupLoads(ThreadState& state) noexcept;
static void RefreshPopupLoads(ThreadState& state) noexcept;


static void WriteOwnedCaption(PublicCaption const& caption,unsigned slot,CaptionColor const& color) {
 if(!OwnsPublicCaptionWindow(caption))throw hresult_error(E_HANDLE);
 WriteCaption(caption.bar,slot,color);
}
static bool RestorePublicCaption(PublicCaption& caption,bool release=true) noexcept {
 if(!OwnsPublicCaptionWindow(caption))return true;
 CaptionWriteGuard guard;bool restored=true;
 for(unsigned slot:publicCaptionSlots)
  restored=UpdateCaptionSlot(caption.slots[slot],nullptr,false,
   [&]{return ReadCaption(caption.bar,slot);},[&](auto const& color){WriteOwnedCaption(caption,slot,color);})&&restored;
 if(restored&&release&&OwnsPublicCaptionWindow(caption))RemovePropW(caption.window,publicCaptionProperty);
 return restored;
}
static bool RestorePublicCaptions(ThreadState& state) noexcept {
 bool restored=true;
 for(auto it=state.publicCaptions.begin();it!=state.publicCaptions.end();) {
  if(RestorePublicCaption(**it))it=state.publicCaptions.erase(it);
  else {restored=false;++it;}
 }
 return restored;
}
static void ApplyPublicCaptions(ThreadState& state) noexcept {
 // Refuse before any enumeration, public getter, AppWindow lookup or setter.
 if constexpr(publicCaptionSlots.empty())return;
 if(!enabled.load()||HighContrast()){RestorePublicCaptions(state);return;}
 try {
  for(auto it=state.publicCaptions.begin();it!=state.publicCaptions.end();) {
   if(!OwnsPublicCaptionWindow(**it))it=state.publicCaptions.erase(it);else ++it;
  }
  EnumThreadWindows(GetCurrentThreadId(),[](HWND window,LPARAM parameter)->BOOL {
   auto& state=*reinterpret_cast<ThreadState*>(parameter);
   if(!PublicCaptionWindow(window)||GetPropW(window,publicCaptionProperty))return TRUE;
   try {
    if(!PublicTitleBar::IsCustomizationSupported())return TRUE;
    using Convert=HRESULT(WINAPI*)(HWND,Microsoft::UI::WindowId*);
    auto interop=GetModuleHandleW(L"Microsoft.Internal.FrameworkUdk.dll");
    auto convert=interop?reinterpret_cast<Convert>(GetProcAddress(interop,"Windowing_GetWindowIdFromWindow")):nullptr;
    Microsoft::UI::WindowId id{};if(!convert||FAILED(convert(window,&id))||!id.Value)return TRUE;
    auto app=Microsoft::UI::Windowing::AppWindow::GetFromWindowId(id);if(!app)return TRUE;
    auto bar=app.TitleBar();
    // Preserve custom content. Only the recorded Notepad button contract admits it.
    if(!bar||!CaptionCompositionAdmitted(bar.ExtendsContentIntoTitleBar()))return TRUE;
    auto caption=std::make_unique<PublicCaption>();caption->window=window;caption->bar=bar;
    for(unsigned slot:publicCaptionSlots)caption->slots[slot].before=ReadCaption(bar,slot);
    // Allocate vector storage before attaching its stable ownership token.
    state.publicCaptions.push_back(std::move(caption));
    if(!SetPropW(window,publicCaptionProperty,state.publicCaptions.back().get()))state.publicCaptions.pop_back();
   }catch(...){Log(230);}
   return TRUE;
  },reinterpret_cast<LPARAM>(&state));
  CaptionWriteGuard guard;
  for(auto& caption:state.publicCaptions) {
   if(!OwnsPublicCaptionWindow(*caption))continue;
   if(caption->declined||!CaptionCompositionAdmitted(caption->bar.ExtendsContentIntoTitleBar())) {
    caption->declined=true;RestorePublicCaption(*caption,false);continue;
   }
   bool complete=true;
   for(unsigned slot:publicCaptionSlots) {
    auto color=box_value(CaptionRoleColor(slot)).as<CaptionColor>();
    complete=UpdateCaptionSlot(caption->slots[slot],color,true,
     [&]{return ReadCaption(caption->bar,slot);},[&](auto const& value){WriteOwnedCaption(*caption,slot,value);})&&complete;
   }
   // Retain failed restoration data for the existing UI-thread retry path.
   if(!complete){caption->declined=true;RestorePublicCaption(*caption,false);Log(231);}
  }
 }catch(...){Log(232);RestorePublicCaptions(state);}
}


static void ObserveWindowBacking(Window const& window) noexcept {
#if !J3W1_LEGACY_XAML
 if(!false||!window||!window.DispatcherQueue().HasThreadAccess()||!enabled.load()||HighContrast()||!ReviewedRuntime())return;
 try {
  com_ptr<NativeXamlWindow> native;if(FAILED(get_unknown(window)->QueryInterface(nativeXamlWindowId,native.put_void())))return;
  HWND handle=nullptr;if(FAILED(native->get_WindowHandle(&handle))||!handle)return;
  DWORD process=0;auto thread=GetWindowThreadProcessId(handle,&process);wchar_t type[64]{};
  if(thread!=GetCurrentThreadId()||process!=GetCurrentProcessId()||!GetClassNameW(handle,type,64)||wcscmp(type,L"MSPaintApp")||!EnsureChannel())return;
  if(GetPropW(handle,windowBackingProperty))return;
  if(uiState->windowBackings.size()>=256)return;
  auto target=window.try_as<Microsoft::UI::Composition::ICompositionSupportsSystemBackdrop>();if(!target)return;
  auto compositor=window.Compositor();if(!compositor)return;
  auto entry=std::make_unique<WindowBacking>();entry->window=handle;entry->target=target;
  entry->brush.applied=compositor.CreateColorBrush(CanvasColor());
  if(!SetPropW(handle,windowBackingProperty,entry.get()))return;
  try{uiState->windowBackings.push_back(std::move(entry));}catch(...){RemovePropW(handle,windowBackingProperty);throw;}
  Schedule();
 }catch(...){/* Unknown/closed targets retain their native backing. */}
#endif
}
static bool RefreshWindowBackings(ThreadState& state,bool active) noexcept {
#if !J3W1_LEGACY_XAML
 if(!active)return RestoreWindowBackings(state.windowBackings);
 bool complete=true;
 for(auto it=state.windowBackings.begin();it!=state.windowBackings.end();) {
  auto& entry=**it;
  // Destroyed/reused HWNDs must never lead to a disposed compositor getter.
  if(!OwnsWindowBacking(entry)){it=state.windowBackings.erase(it);continue;}
  complete=UpdateCompositionBrush(entry.brush,true,[&]{return entry.target.SystemBackdrop();},
    [&](auto const& brush){entry.target.SystemBackdrop(brush?brush.template as<Windows::UI::Composition::CompositionBrush>():Windows::UI::Composition::CompositionBrush{nullptr});})&&complete;
  ++it;
 }
 return complete;
#else
 return true;
#endif
}

static bool PopupBackingAdmission(std::wstring_view type,bool active,bool uiThread,bool loaded,bool sameRoot) noexcept {
 return type==L"Microsoft.UI.Xaml.Controls.MenuFlyoutPresenter"&&active&&uiThread&&loaded&&sameRoot;
}
static bool RestorePopupBackings(std::vector<PopupBacking>& entries) noexcept {
 bool restored=true;
 for(auto& entry:entries)try {
  if(auto element=entry.element.get())
   restored=UpdateCompositionBrush(entry.value,false,[&]{return element.SystemBackdrop();},
    [&](auto const& value){element.SystemBackdrop(value?value.template as<SystemBackdrop>():nullptr);})&&restored;
  else entry.value.owned=false;
 }catch(...){restored=false;}
 if(restored)entries.clear();
 return restored;
}
static void ApplyPopupBacking(Root& root,FrameworkElement const& element) {
 auto owner=root.element.get();
 if(!uiState||!owner||!element||!PopupBackingAdmission(std::wstring_view{get_class_name(element)},
  enabled.load()&&!HighContrast(),ChromeUiThread(element),element.IsLoaded(),Identity(owner.XamlRoot(),element.XamlRoot())))return;
 auto presenter=element.try_as<MenuFlyoutPresenter>();if(!presenter)return;
 auto& entries=uiState->popupBackings;
 for(auto it=entries.begin();it!=entries.end();)if(!it->element.get())it=entries.erase(it);else ++it;
 for(auto& entry:entries)if(Identity(entry.element.get(),presenter)) {
  if(!UpdateCompositionBrush(entry.value,true,[&]{return presenter.SystemBackdrop();},
   [&](auto const& value){presenter.SystemBackdrop(value?value.template as<SystemBackdrop>():nullptr);}))throw hresult_error(E_FAIL);
  return;
 }
 auto native=presenter.SystemBackdrop();
 // Unknown or custom backdrop implementations retain host ownership.
 if(!native||get_class_name(native)!=L"Microsoft.UI.Xaml.Media.DesktopAcrylicBackdrop")return;
 if(entries.size()>=1024)throw hresult_error(E_BOUNDS);
 entries.push_back({make_weak(presenter),{native,nullptr}});
 auto& entry=entries.back();
 if(!UpdateCompositionBrush(entry.value,true,[&]{return presenter.SystemBackdrop();},
  [&](auto const& value){presenter.SystemBackdrop(value?value.template as<SystemBackdrop>():nullptr);}))throw hresult_error(E_FAIL);
}

static bool PaintMenuTriggerAdmission(std::wstring_view owner,std::wstring_view trigger,
 std::wstring_view name,std::wstring_view flyout,bool active,bool uiThread,bool loaded,bool sameRoot,bool menuOwner) noexcept {
 return owner==L"PaintUI.AppChrome"&&trigger==L"Microsoft.UI.Xaml.Controls.Button"
  &&name==L"ContentButton"&&flyout==L"Microsoft.UI.Xaml.Controls.MenuBarItemFlyout"
  &&active&&uiThread&&loaded&&sameRoot&&menuOwner;
}
template<class Read,class Write,class Clear,class IsUnset>
static bool UpdatePreopenMenuStyle(OwnedCompositionBrush& entry,bool active,Read read,Write write,Clear clear,IsUnset unset) noexcept {
 return UpdateCompositionBrush(entry,active,read,[&](auto const& value){if(unset(value))clear();else write(value);});
}
static bool UpdatePreopenMenuStyle(PreopenMenuStyle& entry,bool active) noexcept {
 auto flyout=entry.element.get();if(!flyout){entry.value.owned=false;return true;}
 auto property=MenuFlyout::MenuFlyoutPresenterStyleProperty();
 return UpdatePreopenMenuStyle(entry.value,active,[&]{return flyout.ReadLocalValue(property);},
  [&](auto const& value){flyout.SetValue(property,value);},[&]{flyout.ClearValue(property);},
  [](auto const& value){return Identity(value,DependencyProperty::UnsetValue());});
}
static bool RestorePreopenMenuStyles(std::vector<PreopenMenuStyle>& entries,bool retiredOnly=false) noexcept {
 bool restored=true;
 for(auto it=entries.begin();it!=entries.end();)try {
  auto owner=it->owner.get();
  if(retiredOnly&&owner&&owner.IsLoaded()&&it->element.get()){++it;continue;}
  if(!UpdatePreopenMenuStyle(*it,false)){restored=false;++it;continue;}
  it=entries.erase(it);
 }catch(...){restored=false;++it;}
 return restored;
}
static bool RestorePaintPopups(ThreadState& state) noexcept {
 const bool styles=RestorePreopenMenuStyles(state.preopenMenus);
 return RestorePopupBackings(state.popupBackings)&&styles;
}
static void PreparePaintMenuStyle(Root& root,FrameworkElement const& element) {
 auto owner=root.element.get();
 if(!uiState||!owner||!element||get_class_name(owner)!=L"PaintUI.AppChrome")return;
 auto button=element.try_as<Button>();if(!button||button.Name()!=L"ContentButton")return;
 auto xaml=owner.XamlRoot();if(!xaml||!Identity(element.XamlRoot(),xaml))return;
 bool menuOwner=false,reachedOwner=false;auto ancestor=VisualTreeHelper::GetParent(button);
 for(unsigned depth=0;ancestor&&depth<16;++depth,ancestor=VisualTreeHelper::GetParent(ancestor)) {
  if(auto peer=ancestor.try_as<FrameworkElement>();peer&&!Identity(peer.XamlRoot(),xaml))return;
  if(Identity(ancestor,owner)){reachedOwner=true;break;}
  if(get_class_name(ancestor)==L"Microsoft.UI.Xaml.Controls.MenuBarItem")menuOwner=true;
 }
 auto flyout=button.ContextFlyout().try_as<MenuFlyout>();if(!flyout)return;
 if(!PaintMenuTriggerAdmission(std::wstring_view{get_class_name(owner)},std::wstring_view{get_class_name(button)},
  std::wstring_view{button.Name()},std::wstring_view{get_class_name(flyout)},enabled.load()&&!HighContrast(),
  ChromeUiThread(element)&&flyout.DispatcherQueue().HasThreadAccess(),element.IsLoaded(),reachedOwner,menuOwner))return;
 auto& entries=uiState->preopenMenus;
 for(auto it=entries.begin();it!=entries.end();)if(!it->element.get())it=entries.erase(it);else ++it;
 for(auto& entry:entries)if(Identity(entry.element.get(),flyout)) {
  if(!UpdatePreopenMenuStyle(entry,true))throw hresult_error(E_FAIL);
  return;
 }
 // A local/implicit app style, binding or already-open menu retains ownership.
 // The recorded native endpoint has an unset local value and no effective style.
 auto property=MenuFlyout::MenuFlyoutPresenterStyleProperty();
 if(flyout.IsOpen()||flyout.MenuFlyoutPresenterStyle()
  ||!Identity(flyout.ReadLocalValue(property),DependencyProperty::UnsetValue()))return;
 auto brush=[&](PCWSTR key)->SolidColorBrush {
  for(auto const& entry:root.palette)if(wcscmp(entry.rule->key,key)==0)return entry.applied;
  return nullptr;
 };
 auto background=brush(L"MenuFlyoutPresenterBackground"),foreground=brush(L"MenuFlyoutItemForeground"),border=brush(L"MenuFlyoutPresenterBorderBrush");
 if(!background||!foreground||!border)return;
 if(entries.size()>=64)throw hresult_error(E_BOUNDS);
 Style style{xaml_typename<MenuFlyoutPresenter>()};
 style.Setters().Append(Setter{Control::BackgroundProperty(),background});
 style.Setters().Append(Setter{Control::ForegroundProperty(),foreground});
 style.Setters().Append(Setter{Control::BorderBrushProperty(),border});
// The two-argument WinUI Setter constructor refuses null (E_INVALIDARG).
// Set its property and explicit null value through the public accessors.
 Setter backdrop;backdrop.Property(MenuFlyoutPresenter::SystemBackdropProperty());
 backdrop.Value(nullptr);style.Setters().Append(backdrop);
 // No template, geometry, items, actions, focus or RequestedTheme is replaced.
 // Retain the receipt before writing; a failed setter may have partially applied.
 entries.push_back({make_weak(owner),make_weak(flyout),{nullptr,style}});
 if(!UpdatePreopenMenuStyle(entries.back(),true))throw hresult_error(E_FAIL);
}

static void Refresh(ThreadState& state) noexcept {
 if(state.busy)return;state.busy=true;state.queued=false;
 ApplyPublicCaptions(state);
 const bool active=enabled.load()&&!HighContrast();
 if(!RefreshWindowBackings(state,active))Log(237);
 if(active&&!RestorePreopenMenuStyles(state.preopenMenus,true))Log(239);
 if(!active&&!RestorePaintPopups(state))Log(239);
 if(!active){RestoreChromeAnimations(state.animations);RestoreChromeSetters(state.setters);RestoreChromeBases(state.bases);RestoreChromeTransitions(state.transitions);RestoreKeyTips(state);RestoreNativeBrushes(state.nativeBrushes);if(!RestorePaintSplitEdges(state.paintSplitEdges))Log(238);}
 else if(!state.roots.empty())ApplyKeyTips(state);
 for(auto it=state.pending.begin();it!=state.pending.end();) {
  bool finished=!enabled.load()||HighContrast();
  try {
   if(auto element=it->element.get()) {
    if(auto xaml=element.XamlRoot();xaml&&xaml.Content()) {ObserveRoot(element);finished=true;}
   } else finished=true;
  }catch(...){Log(96);}
  if(finished||++it->attempts>=120)it=state.pending.erase(it);else ++it;
 }
  const size_t rootCount=state.roots.size();
  for(size_t at=0;at<rootCount;at++)try {
  auto& root=state.roots[at];
  if(!enabled.load()||HighContrast()||!root.element.get())Restore(root);
  else if(auto element=root.element.get();element&&element.IsLoaded()&&element.XamlRoot()
    &&ChromeUiThread(element)&&Prepare(root)) {
   ApplyBackdrop(root);ApplyRootBackground(root);Bridge(root);
  }
 }catch(hresult_error const& error){Log(98,static_cast<unsigned>(error.code().value));RestoreChromeAnimations(state.animations);RestoreChromeSetters(state.setters);RestoreChromeBases(state.bases);RestoreChromeTransitions(state.transitions);if(!RestorePaintSplitEdges(state.paintSplitEdges))Log(238);if(!RestorePaintPopups(state))Log(239);Restore(state.roots[at]);}
 catch(...){Log(97);RestoreChromeAnimations(state.animations);RestoreChromeSetters(state.setters);RestoreChromeBases(state.bases);RestoreChromeTransitions(state.transitions);if(!RestorePaintSplitEdges(state.paintSplitEdges))Log(238);if(!RestorePaintPopups(state))Log(239);Restore(state.roots[at]);}
 for(auto it=state.roots.begin();it!=state.roots.end();) {
  if(!it->element.get()&&Restore(*it))it=state.roots.erase(it);else ++it;
 }
 state.ticks++;state.busy=false;RefreshPopupLoads(state);
}
static std::atomic<bool> modulePinned{false};
static void PinForCleanup() noexcept {if(!modulePinned.exchange(true)){HMODULE module=nullptr;GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS,reinterpret_cast<LPCWSTR>(PinForCleanup),&module);Log(178,module!=nullptr);}}
static void Schedule() {
 if(uiState&&!uiState->cleaning&&!uiState->busy&&!uiState->queued){uiState->queued=true;PostMessageW(uiState->channel,dispatchMessage,0,0);}
}

[[clang::no_destroy]] static std::vector<ThreadState*> retiredCleanup;
static bool RestoreThreadState(ThreadState& state) noexcept {
 bool publicRestored=RestorePublicCaptions(state);
 bool restored=RestorePopupLoads(state);
 restored=RestoreKeyTips(state)&&publicRestored&&restored;
 restored=RefreshWindowBackings(state,false)&&restored;
 restored=RestorePaintPopups(state)&&restored;
 restored=RestoreNativeBrushes(state.nativeBrushes)&&restored;
 restored=RestorePaintSplitEdges(state.paintSplitEdges)&&restored;
 restored=RestoreChromeAnimations(state.animations)&&restored;
 restored=RestoreChromeSetters(state.setters)&&restored;
 restored=RestoreChromeBases(state.bases)&&restored;
 restored=RestoreChromeTransitions(state.transitions)&&restored;
 for(auto& root:state.roots) {
  if(root.layout.value)try {
   if(auto element=root.element.get())element.LayoutUpdated(root.layout);
   root.layout={};
  }catch(...){Log(79);restored=false;}
  restored=Restore(root)&&restored;
 }
 return restored;
}
static bool FinishChannelCleanup(ThreadState& state,bool restored,bool destroyed=false) noexcept {
 state.cleaning=true;state.busy=true;state.queued=false;
 if(!restored) {
  PinForCleanup();
  if(!destroyed) {SetTimer(state.channel,timerId,250,nullptr);return false;}
  // Process teardown can destroy the channel before an app-owned setter can
  // recover. Retain the captured objects rather than discard rollback data.
  retiredCleanup.push_back(&state);
 }
 const HWND window=state.channel;auto original=state.original;
 {std::lock_guard guard(channelMutex);channels.erase(std::remove(channels.begin(),channels.end(),window),channels.end());}
 SetWindowLongPtrW(window,GWLP_WNDPROC,reinterpret_cast<LONG_PTR>(original));SetWindowLongPtrW(window,GWLP_USERDATA,0);
 uiState=nullptr;if(restored)delete &state;
 if(!destroyed)DestroyWindow(window);
 return true;
}
static LRESULT CALLBACK ChannelProc(HWND window,UINT message,WPARAM wParam,LPARAM lParam) {
 auto state=reinterpret_cast<ThreadState*>(GetWindowLongPtrW(window,GWLP_USERDATA));
 if(!state)return DefWindowProcW(window,message,wParam,lParam);
 if(((message==dispatchMessage&&lParam==0)&&wParam==1)||message==WM_NCDESTROY
   ||(state->cleaning&&(message==dispatchMessage||(message==WM_TIMER&&wParam==timerId)))) {
  state->cleaning=true;state->busy=true;KillTimer(window,timerId);
  auto original=state->original;bool destroyed=message==WM_NCDESTROY;
  FinishChannelCleanup(*state,RestoreThreadState(*state),destroyed);
  return destroyed?CallWindowProcW(original,window,message,wParam,lParam):0;
 }
 if((message==dispatchMessage&&lParam==0)||(message==WM_TIMER&&wParam==timerId)){Refresh(*state);return 0;}
 return CallWindowProcW(state->original,window,message,wParam,lParam);
}
static bool EnsureChannel() {
 if(!uiState) {
  HWND channel=CreateWindowExW(0,L"STATIC",nullptr,0,0,0,0,0,HWND_MESSAGE,nullptr,nullptr,nullptr);if(!channel)return false;
  auto state=new ThreadState;state->channel=channel;
  state->original=reinterpret_cast<WNDPROC>(SetWindowLongPtrW(channel,GWLP_WNDPROC,reinterpret_cast<LONG_PTR>(ChannelProc)));
  if(!state->original){delete state;DestroyWindow(channel);return false;}
  SetWindowLongPtrW(channel,GWLP_USERDATA,reinterpret_cast<LONG_PTR>(state));uiState=state;
  {std::lock_guard guard(channelMutex);channels.push_back(channel);}
  SetTimer(channel,timerId,250,nullptr);
 }
 return true;
}
static void ObserveRoot(FrameworkElement const& element) {
 if(!element||!enabled.load()||HighContrast()||!EnsureChannel())return;
 if(auto xaml=element.XamlRoot();xaml&&xaml.Content()) {
  // Diagnostics can report an admitted app control below a generic island
  // root. Choose only its topmost named chrome ancestor in this same XamlRoot.
  auto content=xaml.Content().try_as<FrameworkElement>();
  auto admitted=SelectChromeRoot(element,content,FrameworkElement{nullptr},
   [](auto const& candidate){return get_class_name(candidate);},
   [](auto const& candidate){return VisualTreeHelper::GetParent(candidate).template try_as<FrameworkElement>();},
   [&](auto const& candidate){return Identity(candidate.XamlRoot(),xaml);});
  Track(admitted,nullptr);return;
 }
 for(auto const& pending:uiState->pending)if(Identity(pending.element.get(),element))return;
 if(uiState->pending.size()<1024)uiState->pending.push_back({make_weak(element),0});
}
static void Track(UIElement const& content,DesktopWindowXamlSource const& source,Window const& window) {
 auto element=content.try_as<FrameworkElement>();if(!element||!RootCandidateClass(std::wstring_view{get_class_name(element)})||!EnsureChannel())return;
 for(auto& prior:uiState->roots)if(Identity(prior.element.get(),element)){
  if(source)prior.source=make_weak(source);if(window)prior.window=make_weak(window);return;
 }
 if(uiState->roots.size()>=32)return;
 Root root;root.element=make_weak(element);if(source)root.source=make_weak(source);if(window)root.window=make_weak(window);root.layout=element.LayoutUpdated([](auto const&,auto const&){Schedule();});
 uiState->roots.push_back(std::move(root));Log(10,static_cast<unsigned>(uiState->roots.size()));Schedule();
}

static bool PopupChromeClass(std::wstring_view type) noexcept {
 return type==L"Microsoft.UI.Xaml.Controls.MenuFlyoutPresenter"
  ||type==L"Microsoft.UI.Xaml.Controls.FlyoutPresenter"
  ||type==L"Microsoft.UI.Xaml.Controls.ToolTip"
  ||type==L"Microsoft.UI.Xaml.Controls.MenuFlyoutItem"
  ||type==L"Microsoft.UI.Xaml.Controls.MenuFlyoutSubItem";
}
static bool PopupObservationAdmission(std::wstring_view type,bool uiThread,bool active) noexcept {
 return active&&uiThread&&PopupChromeClass(type);
}
static bool PopupDiscoveryAdmission(std::wstring_view type,bool uiThread,bool active,bool loaded,bool sameRoot) noexcept {
 return active&&uiThread&&loaded&&sameRoot&&PopupChromeClass(type);
}
static bool RemovePopupLoadedEvent(FrameworkElement const& element,event_token token) noexcept {
 // The projected event remover discards HRESULT. Use its public typed ABI to
 // distinguish an actual detach from a failure that must keep its receipt.
 try {
  auto api=element.as<IFrameworkElement>();
  auto abi=reinterpret_cast<winrt::impl::abi_t<IFrameworkElement>*>(get_abi(api));
  return SUCCEEDED(abi->remove_Loaded(token));
 }catch(...){return false;}
}
static bool RestorePopupLoads(ThreadState& state) noexcept {
 return RevokePopupLoadEvents(state.popupLoads,[](auto const& entry){return entry.element.get();},
  [](auto const&){return true;},RemovePopupLoadedEvent);
}
static bool DetachPopupLoad(ThreadState& state,FrameworkElement const& element) noexcept {
 return RevokePopupLoadEvents(state.popupLoads,[](auto const& entry){return entry.element.get();},
  [&](auto const& candidate){return Identity(candidate,element);},RemovePopupLoadedEvent);
}
static void ObservePopupChrome(FrameworkElement const& element);
static void WatchPopupLoad(FrameworkElement const& element) {
 auto& state=*uiState;
 if(!RevokePopupLoadEvents(state.popupLoads,[](auto const& entry){return entry.element.get();},
  [](auto const&){return false;},RemovePopupLoadedEvent))return;
 for(auto const& entry:state.popupLoads)if(Identity(entry.element.get(),element))return;
 if(state.popupLoads.size()>=1024)return;
 state.popupLoads.push_back({make_weak(element)});
 auto& receipt=state.popupLoads.back();auto expected=&state;
 try {
  receipt.loaded=element.Loaded([expected](auto const& sender,auto const&) {
   // A reentrant notification remains queued for the existing refresh. Never
   // follow a receipt into a different dispatcher or a retired channel.
   if(uiState!=expected||uiState->busy||uiState->cleaning)return;
   try{ObservePopupChrome(sender.template try_as<FrameworkElement>());}catch(...){Schedule();}
  });
  receipt.registered=true;
 }catch(...){state.popupLoads.pop_back();throw;}
 // Registration and readiness can overlap in a native notification. The
 // ordinary refresh also retries ready receipts after a reentrant callback.
 if(element.IsLoaded())ObservePopupChrome(element);
}
static void RefreshPopupLoads(ThreadState& state) noexcept {
 if(!enabled.load()||HighContrast()){if(!RestorePopupLoads(state))Log(253);return;}
 try {
  RevokePopupLoadEvents(state.popupLoads,[](auto const& entry){return entry.element.get();},
   [](auto const&){return false;},RemovePopupLoadedEvent);
  std::vector<FrameworkElement> ready;
  for(auto const& entry:state.popupLoads)if(auto element=entry.element.get();element&&element.IsLoaded())ready.push_back(element);
  for(auto const& element:ready)ObservePopupChrome(element);
 }catch(...){Log(254);}
}
static void ObservePopupChrome(FrameworkElement const& element) {
 if(!element||!uiState||uiState->busy||uiState->cleaning)return;
 auto type=get_class_name(element);
 if(!PopupObservationAdmission(std::wstring_view{type},ChromeUiThread(element),enabled.load()&&!HighContrast())) {
  if(!DetachPopupLoad(*uiState,element))Log(253);return;
 }
 if(!element.IsLoaded()){WatchPopupLoad(element);return;}
 if(!DetachPopupLoad(*uiState,element)){Schedule();return;}
 auto xaml=element.XamlRoot();if(!xaml)return;
 for(auto& root:uiState->roots) {
  auto owner=root.element.get();if(!owner||root.palette.empty())continue;
  if(!PopupDiscoveryAdmission(std::wstring_view{type},ChromeUiThread(element),enabled.load(),element.IsLoaded(),Identity(owner.XamlRoot(),xaml)))continue;
  // Resource changes can synchronously report more visual-tree mutations.
  // Reentrant callbacks wait for the existing bounded refresh path.
  struct Guard {ThreadState& state;explicit Guard(ThreadState& value):state(value){state.busy=true;}~Guard(){state.busy=false;}};
  // Refreshing the presenter resource alone leaves cached template children
  // and state brushes native until the next message/timer pass. Apply the
  // existing bounded bridge synchronously to this admitted popup instead.
  try {Guard guard(*uiState);Bridge(root,element);}
  catch(...) {
   // Match the ordinary refresh failure path. Partial ownership survives
   // failed restores and the existing scheduler retries its cleanup.
   {
    Guard guard(*uiState);
    RestoreChromeAnimations(uiState->animations);RestoreChromeSetters(uiState->setters);
    RestoreChromeBases(uiState->bases);RestoreChromeTransitions(uiState->transitions);
    if(!RestorePaintSplitEdges(uiState->paintSplitEdges))Log(238);
    if(!RestorePaintPopups(*uiState))Log(239);
    Restore(root);
   }
   Schedule();return;
  }
  Schedule();return;
 }
}

// Original adapter discovery through the WinUI diagnostics COM contracts.
// The packaged WinUI bridge is verified before it is loaded. The connection
// targets this admitted process and passes our already-loaded adapter DLL.
// Existing roots and later mutations arrive on each object's UI dispatcher.
static bool ReviewedDiagnosticsBridge(std::wstring const& path) {
 HANDLE file=CreateFileW(path.c_str(),GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr);
 if(file==INVALID_HANDLE_VALUE)return false;
 BCRYPT_ALG_HANDLE algorithm=nullptr;BCRYPT_HASH_HANDLE hash=nullptr;
 DWORD size=0,written=0;std::vector<BYTE> object;BYTE digest[32]{};bool valid=false;
 if(BCryptOpenAlgorithmProvider(&algorithm,BCRYPT_SHA256_ALGORITHM,nullptr,0)>=0
  &&BCryptGetProperty(algorithm,BCRYPT_OBJECT_LENGTH,reinterpret_cast<PUCHAR>(&size),sizeof(size),&written,0)>=0) {
  object.resize(size);
  if(BCryptCreateHash(algorithm,&hash,object.data(),size,nullptr,0,0)>=0) {
   BYTE buffer[65536];DWORD count=0;bool complete=false;
   for(;;){if(!ReadFile(file,buffer,sizeof(buffer),&count,nullptr))break;
    if(!count){complete=true;break;}if(BCryptHashData(hash,buffer,count,0)<0)break;}
   if(complete&&BCryptFinishHash(hash,digest,sizeof(digest),0)>=0) {
    constexpr char hex[]="0123456789abcdef";std::string actual;
    for(BYTE byte:digest){actual+=hex[byte>>4];actual+=hex[byte&15];}
    valid=actual=="76fa4a93d1ae9c77f8c89222fbe7870e9b7c6eccf8d35d91ec43404df180e29c";
   }
  }
 }
 if(hash)BCryptDestroyHash(hash);if(algorithm)BCryptCloseAlgorithmProvider(algorithm,0);CloseHandle(file);return valid;
}
struct RootDiscoverySession {
 std::mutex mutex;
 com_ptr<IXamlDiagnostics> diagnostics;
 com_ptr<IVisualTreeService> service;
 com_ptr<IVisualTreeServiceCallback> callback;
 std::atomic<bool> stopping{false};std::atomic<unsigned> callbacks{0};
 HANDLE stop=nullptr,refresh=nullptr,worker=nullptr;bool advised=false;
};
// The pinned compiler does not implement atomic<shared_ptr>. Keep both reader
// copies and lifecycle replacement under one short lock, never a COM call.
struct RootDiscoverySlot {
 std::mutex mutex;std::shared_ptr<RootDiscoverySession> value;
 std::shared_ptr<RootDiscoverySession> load(){std::lock_guard guard(mutex);return value;}
 void store(std::shared_ptr<RootDiscoverySession> next){std::lock_guard guard(mutex);value=std::move(next);}
};
[[clang::no_destroy]] static RootDiscoverySlot rootDiscovery;
static constexpr CLSID rootDiscoveryClsid={0x7cbd47c2,0x78b3,0x439d,{0x82,0xe8,0x7c,0x19,0xac,0x25,0x13,0xd4}};
static bool DiscoveryAdmission(std::wstring_view type,bool uiThread,bool active) noexcept {
 return active&&uiThread&&RootCandidateClass(type);
}
struct RootDiscoveryTap : implements<RootDiscoveryTap,IObjectWithSite,IVisualTreeServiceCallback> {
 std::shared_ptr<RootDiscoverySession> state;
 explicit RootDiscoveryTap(std::shared_ptr<RootDiscoverySession> value):state(std::move(value)){}
 HRESULT STDMETHODCALLTYPE SetSite(::IUnknown* site) noexcept final {
  if(!site)return S_OK;
  if(state->stopping.load()||!ReviewedPackage()||!ReviewedRuntime())return E_ACCESSDENIED;
  try {
   com_ptr<IXamlDiagnostics> diagnostics;com_ptr<IVisualTreeService> service;
   check_hresult(site->QueryInterface(__uuidof(IXamlDiagnostics),diagnostics.put_void()));
   check_hresult(site->QueryInterface(__uuidof(IVisualTreeService),service.put_void()));
   com_ptr<IVisualTreeServiceCallback> callback;callback.copy_from(static_cast<IVisualTreeServiceCallback*>(this));
   std::lock_guard guard(state->mutex);
   if(state->stopping.load()||state->diagnostics)return E_UNEXPECTED;
   state->diagnostics=diagnostics;state->service=service;state->callback=callback;
   // SetSite is called on the UI thread. Subscription runs on our worker,
   // because WinUI's initial enumeration waits for all UI dispatchers.
   return S_OK;
  }catch(hresult_error const& error){return error.code();}catch(...){return E_FAIL;}
 }
 HRESULT STDMETHODCALLTYPE GetSite(REFIID iid,void** output) noexcept final {
  if(!output)return E_POINTER;*output=nullptr;
  com_ptr<IXamlDiagnostics> diagnostics;{std::lock_guard guard(state->mutex);diagnostics=state->diagnostics;}
  return diagnostics?diagnostics->QueryInterface(iid,output):E_FAIL;
 }
 HRESULT STDMETHODCALLTYPE OnVisualTreeChange(ParentChildRelation relation,VisualElement element,VisualMutationType mutation) noexcept final {
  struct Activity {std::atomic<unsigned>& count;Activity(std::atomic<unsigned>& value):count(value){++count;}~Activity(){--count;}} activity(state->callbacks);
  if(state->stopping.load()||!enabled.load()||mutation!=VisualMutationType::Add||!element.Type)return S_OK;
  // Type is metadata. Do not query names, document contents or data controls.
  std::wstring_view type(element.Type,SysStringLen(element.Type));
  // A diagnostic root can expose the existing XAML Window. Query only that
  // public interface; leaf data controls never grant backing ownership.
  if(relation.Parent&&!RootCandidateClass(type)&&!PopupChromeClass(type))return S_OK;
  try {
   com_ptr<IXamlDiagnostics> diagnostics;{std::lock_guard guard(state->mutex);diagnostics=state->diagnostics;}
   if(!diagnostics)return S_OK;
   com_ptr<::IInspectable> instance;check_hresult(diagnostics->GetIInspectableFromHandle(element.Handle,instance.put()));
   Windows::Foundation::IInspectable value{nullptr};copy_from_abi(value,instance.get());
   if(!relation.Parent)if(auto window=value.try_as<Window>())ObserveWindowBacking(window);
   auto framework=value.try_as<FrameworkElement>();
   if(framework&&!state->stopping.load()) {
    if(DiscoveryAdmission(type,ChromeUiThread(framework),enabled.load()))ObserveRoot(framework);
    else if(PopupChromeClass(type))ObservePopupChrome(framework);
   }
  }catch(...){/* An expired diagnostics handle never grants fallback admission. */}
  return S_OK;
 }
};
struct RootDiscoveryFactory : implements<RootDiscoveryFactory,IClassFactory> {
 std::shared_ptr<RootDiscoverySession> state;
 explicit RootDiscoveryFactory(std::shared_ptr<RootDiscoverySession> value):state(std::move(value)){}
 HRESULT STDMETHODCALLTYPE CreateInstance(::IUnknown* outer,REFIID iid,void** output) noexcept final {
  if(!output)return E_POINTER;*output=nullptr;if(outer)return CLASS_E_NOAGGREGATION;
  if(state->stopping.load())return E_ACCESSDENIED;
  try{return make<RootDiscoveryTap>(state).as<::IUnknown>()->QueryInterface(iid,output);}catch(...){return E_FAIL;}
 }
 HRESULT STDMETHODCALLTYPE LockServer(BOOL) noexcept final {return E_NOTIMPL;}
};
extern "C" __declspec(dllexport) HRESULT WINAPI DllGetClassObject(REFCLSID clsid,REFIID iid,void** output) {
 if(!output)return E_POINTER;*output=nullptr;
 auto state=rootDiscovery.load();if(clsid!=rootDiscoveryClsid||!state||state->stopping.load())return CLASS_E_CLASSNOTAVAILABLE;
 try{return make<RootDiscoveryFactory>(state).as<::IUnknown>()->QueryInterface(iid,output);}catch(...){return E_FAIL;}
}
static bool DiscoveryDetach(RootDiscoverySession& state) noexcept {
 com_ptr<IVisualTreeService> service;com_ptr<IVisualTreeServiceCallback> callback;bool advised=false;
 {std::lock_guard guard(state.mutex);service=state.service;callback=state.callback;advised=state.advised;}
 if(advised&&service&&callback&&FAILED(service->UnadviseVisualTreeChange(callback.get())))return false;
 {std::lock_guard guard(state.mutex);state.advised=false;}
 for(unsigned attempt=0;state.callbacks.load()&&attempt<500;++attempt)Sleep(10);
 if(state.callbacks.load())return false;
 return true;
}
static bool DiscoverySubscribe(RootDiscoverySession& state) noexcept {
 if(!DiscoveryDetach(state)||state.stopping.load())return false;
 com_ptr<IVisualTreeService> service;com_ptr<IVisualTreeServiceCallback> callback;
 {std::lock_guard guard(state.mutex);service=state.service;callback=state.callback;}
 if(!service||!callback)return false;
 const HRESULT result=service->AdviseVisualTreeChange(callback.get());
 {std::lock_guard guard(state.mutex);state.advised=SUCCEEDED(result);}
 // A failed Advise can retain its callback in the inspected runtime. Try the
 // same exact callback when detaching even if enumeration returned a failure.
 if(FAILED(result)){std::lock_guard guard(state.mutex);state.advised=true;return false;}
 return true;
}
static DWORD WINAPI RootDiscoveryWorker(void* parameter) {
 auto state=*static_cast<std::shared_ptr<RootDiscoverySession>*>(parameter);
 delete static_cast<std::shared_ptr<RootDiscoverySession>*>(parameter);
 bool apartment=false;
 try {
  for(unsigned attempt=0;attempt<50&&!state->stopping.load();++attempt) {
   if(ReviewedRuntime()) {
    // Do not start COM (and its background handle cache) for an unadmitted
    // runtime. Diagnostics are the only path here that needs an apartment.
    init_apartment(apartment_type::multi_threaded);apartment=true;
    auto runtime=GetModuleHandleW(L"Microsoft.UI.Xaml.dll");HMODULE self=nullptr;
    wchar_t path[32768]{},runtimePath[32768]{};
    DWORD runtimeLength=GetModuleFileNameW(runtime,runtimePath,std::size(runtimePath));
    if(!runtimeLength||runtimeLength>=std::size(runtimePath)
     ||!GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,reinterpret_cast<LPCWSTR>(RootDiscoveryWorker),&self))break;
    DWORD selfLength=GetModuleFileNameW(self,path,std::size(path));if(!selfLength||selfLength>=std::size(path))break;
    std::wstring bridgePath=runtimePath;
#if !J3W1_LEGACY_XAML
    auto slash=bridgePath.find_last_of(L"\\");if(slash==std::wstring::npos)break;
    bridgePath.resize(slash+1);bridgePath+=L"Microsoft.Internal.FrameworkUdk.dll";
#endif
    if(!ReviewedDiagnosticsBridge(bridgePath))break;
    auto bridge=LoadLibraryExW(bridgePath.c_str(),nullptr,LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR|LOAD_LIBRARY_SEARCH_SYSTEM32);
    if(!bridge)break;
    auto initialize=reinterpret_cast<HRESULT(WINAPI*)(LPCWSTR,DWORD,LPCWSTR,LPCWSTR,CLSID,LPCWSTR)>(GetProcAddress(bridge,"InitializeXamlDiagnosticsEx"));
    HRESULT result=initialize?initialize(J3W1_LEGACY_XAML?L"VisualDiagConnection1":L"WinUIVisualDiagConnection1",GetCurrentProcessId(),runtimePath,path,rootDiscoveryClsid,nullptr):E_NOINTERFACE;
    FreeLibrary(bridge);
    if(FAILED(result))break;
    for(unsigned wait=0;wait<50&&!state->stopping.load();++wait) {
     bool ready=false;{std::lock_guard guard(state->mutex);ready=state->service&&state->callback;}
     if(ready)break;if(WaitForSingleObject(state->stop,100)!=WAIT_TIMEOUT)break;
    }
    if(!state->stopping.load()&&DiscoverySubscribe(*state)) {
     HANDLE events[]={state->stop,state->refresh};
     while(!state->stopping.load()) {
      DWORD wait=WaitForMultipleObjects(2,events,FALSE,INFINITE);
      if(wait!=WAIT_OBJECT_0+1||!DiscoverySubscribe(*state))break;
     }
    }
    break;
   }
   if(WaitForSingleObject(state->stop,100)!=WAIT_TIMEOUT)break;
  }
 }catch(...){/* Missing or inaccessible diagnostics leave native roots intact. */}
 if(!DiscoveryDetach(*state))PinForCleanup();
 else {std::lock_guard guard(state->mutex);state->callback=nullptr;state->service=nullptr;state->diagnostics=nullptr;}
 if(apartment)uninit_apartment();return 0;
}
static bool StartRootDiscovery() noexcept {
 if(rootDiscovery.load())return false;
 try {
  auto state=std::make_shared<RootDiscoverySession>();
  state->stop=CreateEventW(nullptr,TRUE,FALSE,nullptr);state->refresh=CreateEventW(nullptr,FALSE,FALSE,nullptr);
  if(!state->stop||!state->refresh){if(state->stop)CloseHandle(state->stop);if(state->refresh)CloseHandle(state->refresh);return false;}
  auto argument=new(std::nothrow) std::shared_ptr<RootDiscoverySession>(state);
  if(!argument){CloseHandle(state->stop);CloseHandle(state->refresh);return false;}
  rootDiscovery.store(state);state->worker=CreateThread(nullptr,0,RootDiscoveryWorker,argument,0,nullptr);
  if(!state->worker){delete argument;rootDiscovery.store(nullptr);CloseHandle(state->stop);CloseHandle(state->refresh);return false;}
  return true;
 }catch(...){return false;}
}
static bool StopRootDiscovery() noexcept {
 auto state=rootDiscovery.load();if(!state)return true;
 state->stopping=true;SetEvent(state->stop);
 if(WaitForSingleObject(state->worker,5000)!=WAIT_OBJECT_0){PinForCleanup();return false;}
 if(!DiscoveryDetach(*state)){PinForCleanup();return false;}
 bool retained=false;{std::lock_guard guard(state->mutex);state->callback=nullptr;state->service=nullptr;state->diagnostics=nullptr;retained=state->advised;}
 if(retained){PinForCleanup();return false;}
 CloseHandle(state->worker);CloseHandle(state->stop);CloseHandle(state->refresh);rootDiscovery.store(nullptr);return true;
}
static void RefreshRootDiscovery() noexcept {auto state=rootDiscovery.load();if(state&&!state->stopping.load())SetEvent(state->refresh);}


using Create=HRESULT(STDMETHODCALLTYPE*)(void*,void*,void**,void**);
static constexpr unsigned factoryCount=7;
static Create originalCreate[factoryCount]{};
static std::atomic<void*> factoryTable[factoryCount]{};
static std::atomic<void*> factoryFunction[factoryCount]{};
[[clang::no_destroy]] static std::array<ProjectedObject,factoryCount> factoryIdentity{},activationIdentity{};
static std::atomic<bool> hooked[factoryCount]{};
using Activate=HRESULT(STDMETHODCALLTYPE*)(void*,void**);
static Activate originalActivate[factoryCount]{};
static std::atomic<void*> activationTable[factoryCount]{},activationFunction[factoryCount]{};
static std::atomic<bool> activationHooked[factoryCount]{};
static std::atomic<bool> activationReady{false};
using ContentSetter=HRESULT(STDMETHODCALLTYPE*)(void*,void*);
static ContentSetter originalIslandContent=nullptr,originalWindowContent=nullptr;
static bool SameFactory(void* self,ProjectedObject const& expected) noexcept {
 if(!self||!expected)return false;
 try{ProjectedObject actual{nullptr};copy_from_abi(actual,self);return Identity(actual,expected);}catch(hresult_error const& error){Log(252,static_cast<unsigned>(error.code().value));return false;}catch(...){return false;}
}
static bool RuntimeFunction(void* function) {
 HMODULE module=nullptr;return GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,reinterpret_cast<LPCWSTR>(function),&module)&&module==GetModuleHandleW(L"Microsoft.UI.Xaml.dll");
}
static HRESULT STDMETHODCALLTYPE IslandContentHook(void* instance,void* content) {
 auto result=originalIslandContent(instance,content);
 if(enabled.load()&&SUCCEEDED(result)&&content&&!HighContrast())try {
  UIElement value{nullptr};copy_from_abi(value,content);DesktopWindowXamlSource source{nullptr};copy_from_abi(source,instance);Track(value,source);
 }catch(hresult_error const& error){Log(199,static_cast<unsigned>(error.code().value));}
 return result;
}
static HRESULT STDMETHODCALLTYPE WindowContentHook(void* instance,void* content) {
 auto result=originalWindowContent(instance,content);
 if(enabled.load()&&SUCCEEDED(result)&&content&&!HighContrast())try {
  UIElement value{nullptr};copy_from_abi(value,content);Window window{nullptr};copy_from_abi(window,instance);Track(value,nullptr,window);
  ObserveWindowBacking(window);
 }catch(hresult_error const& error){Log(199,static_cast<unsigned>(error.code().value));}
 return result;
}
static void AdmitSource(ProjectedObject const& object) {
 if(auto api=object.try_as<IDesktopWindowXamlSource>();api&&!contentReady.load()) {
  auto function=(*reinterpret_cast<void***>(get_abi(api)))[7];
  if(RuntimeFunction(function)&&Wh_SetFunctionHook(function,reinterpret_cast<void*>(IslandContentHook),reinterpret_cast<void**>(&originalIslandContent))&&Wh_ApplyHookOperations()){contentReady=true;Log(200,1);}
 }
 if(auto api=object.try_as<IWindow>();api&&!windowContentReady.load()) {
  auto function=(*reinterpret_cast<void***>(get_abi(api)))[9];
  if(RuntimeFunction(function)&&Wh_SetFunctionHook(function,reinterpret_cast<void*>(WindowContentHook),reinterpret_cast<void**>(&originalWindowContent))&&Wh_ApplyHookOperations()){windowContentReady=true;Log(201,1);}
 }
}


// A composable base constructor also serves inspected app-derived controls.
// Its factory identity differs, so admit the returned public container instead.
// Mutation still requires a loaded root in this exact package/runtime. Known
// drawing, swatch and editor classes are deliberately absent from this list.
static bool RootCandidateClass(std::wstring_view name) {
 for(auto known:{L"PaintUI.AppChrome",L"PaintUI.Ribbon",L"PaintUI.RibbonControl",L"PaintUI.LayersPanel"})if(name==known)return true;
 return false;
}
static void ObserveConstructedContainer(ProjectedObject const& value) {
 if(auto window=value.try_as<Window>())ObserveWindowBacking(window);
 auto element=value.try_as<FrameworkElement>();
 if(element&&RootCandidateClass(std::wstring_view{get_class_name(element)})
   &&ChromeUiThread(element))ObserveRoot(element);
}
template<unsigned N> static HRESULT STDMETHODCALLTYPE CreateHook(void* self,void* outer,void** inner,void** object){
 auto result=originalCreate[N](self,outer,inner,object);

 bool admitted=false;
 if(self)for(unsigned at=0;at<factoryCount;at++)if(hooked[at].load()&&factoryFunction[at].load()==factoryFunction[N].load()&&SameFactory(self,factoryIdentity[at])){admitted=true;break;}
 Log(240,N,admitted);
 if(SUCCEEDED(result)&&object&&*object)try {
  ProjectedObject value{nullptr};copy_from_abi(value,*object);
  unsigned mask=0;
  if(auto element=value.try_as<FrameworkElement>()) {
   mask|=1;if(ChromeUiThread(element))mask|=8;
   if(element.XamlRoot())mask|=16;
  }
  if(value.try_as<DesktopWindowXamlSource>())mask|=2;
  if(value.try_as<Window>())mask|=4;
  Log(263,N,mask);
 }catch(hresult_error const& error){Log(264,N,static_cast<unsigned>(error.code().value));}

 if(enabled.load()&&SUCCEEDED(result)&&object&&*object&&!HighContrast())try{
  ProjectedObject value{nullptr};copy_from_abi(value,*object);
  if(admitted)AdmitSource(value);
  ObserveConstructedContainer(value);
 }catch(hresult_error const& e){Log(29,e.code().value);}catch(...){Log(28);}
 return result;
}

// Non-composable activation uses IActivationFactory::ActivateInstance, whose
// ABI differs from a composable constructor. Admit only the seven inspected
// XAML factories and keep the returned object's content on its owning thread.
template<unsigned N> static HRESULT STDMETHODCALLTYPE ActivationHook(void* self,void** object) {
 auto result=originalActivate[N](self,object);
 bool admitted=false;
 if(self)for(unsigned at=0;at<factoryCount;at++)
  if(activationHooked[at].load()&&activationFunction[at].load()==activationFunction[N].load()
    &&SameFactory(self,activationIdentity[at])){admitted=true;break;}
 Log(241,N,admitted);Log(245,static_cast<unsigned>(result),object&&*object);
 // Diagnostic only: public interface capabilities of the returned object.
 // No document properties, paths, text, or object state are changed here.
 if(SUCCEEDED(result)&&object&&*object)try {
  ProjectedObject value{nullptr};copy_from_abi(value,*object);
  unsigned mask=0;
  if(auto element=value.try_as<FrameworkElement>()) {
   mask|=1;if(ChromeUiThread(element))mask|=8;
   if(element.XamlRoot())mask|=16;
  }
  if(value.try_as<DesktopWindowXamlSource>())mask|=2;
  if(value.try_as<Window>())mask|=4;
  if(value.try_as<SolidColorBrush>())mask|=32;
  Log(254,N,mask);
 }catch(hresult_error const& error){Log(255,N,static_cast<unsigned>(error.code().value));}

 if(enabled.load()&&SUCCEEDED(result)&&object&&*object&&admitted&&!HighContrast())try {
  ProjectedObject value{nullptr};copy_from_abi(value,*object);AdmitSource(value);
  if(auto source=value.try_as<DesktopWindowXamlSource>();source&&source.Content())Track(source.Content(),source);
  if(auto window=value.try_as<Window>()){ObserveWindowBacking(window);if(window.Content())Track(window.Content(),nullptr,window);}
  if(auto element=value.try_as<FrameworkElement>())ObserveRoot(element);
 }catch(hresult_error const& error){Log(242,static_cast<unsigned>(error.code().value));}
 catch(...){Log(243);}
 return result;
}

// Caption colors are write-only. Existing windows with unknown state are not
// recolored until an application request supplies a baseline. Windows created
// after hook installation have a known default baseline; creation-time requests
// are captured by the same hook before CreateWindowEx returns.

// Only captured caption owners may request an opaque native backing. Public
// Notepad title APIs remain refused; preexisting unknown caption colors are
// never inferred. Paint keeps its native backdrop and public caption contract.
struct NativeBackdrop { DWORD before=DWMSBT_AUTO; bool owned=false,changed=false; };
template<class Read,class Write> static bool UpdateNativeBackdrop(NativeBackdrop& slot,bool active,Read read,Write write) noexcept {
 try {
  if(slot.changed||(!active&&!slot.owned))return true;
  DWORD current=0;if(FAILED(read(current)))return false;
  if(slot.owned&&current!=DWMSBT_NONE){slot.owned=false;slot.changed=true;return true;}
  if(!active) {
   if(slot.owned){if(FAILED(write(slot.before)))return false;slot.owned=false;}
   return true;
  }
  if(current>DWMSBT_TABBEDWINDOW)return false;
  if(!slot.owned){slot.before=current;if(FAILED(write(DWORD(DWMSBT_NONE))))return false;slot.owned=true;}
  return true;
 }catch(...){return false;}
}
struct Caption { HWND window; COLORREF before=DWMWA_COLOR_DEFAULT; bool applied=false; NativeBackdrop backdrop; };
static constexpr PCWSTR captionProperty=L"j3w1-paint-chrome-caption-owner";
[[clang::no_destroy]] static std::vector<Caption*> captions;
[[clang::no_destroy]] static std::mutex captionsMutex;
static decltype(&CreateWindowExW) originalCreateWindow=nullptr;
static decltype(&DestroyWindow) originalDestroyWindow=nullptr;
static decltype(&DwmSetWindowAttribute) originalDwmSet=nullptr;
static decltype(&DwmGetWindowAttribute) nativeDwmGet=DwmGetWindowAttribute;
static bool CaptionWindow(HWND window) {
 DWORD process=0;GetWindowThreadProcessId(window,&process);wchar_t type[64]{};
 return process==GetCurrentProcessId()&&GetAncestor(window,GA_ROOT)==window&&GetClassNameW(window,type,std::size(type))
  &&wcscmp(type,L"MSPaintApp")==0&&false;
}
static Caption* OwnedCaption(HWND window) {
 auto state=static_cast<Caption*>(GetPropW(window,captionProperty));
 return std::find(captions.begin(),captions.end(),state)!=captions.end()?state:nullptr;
}
static Caption* CaptureCaption(HWND window,COLORREF before) {
 if(auto state=OwnedCaption(window))return state;
 if(GetPropW(window,captionProperty))return nullptr;
 auto state=new(std::nothrow) Caption{window,before,false};if(!state)return nullptr;
 if(!SetPropW(window,captionProperty,state)){delete state;return nullptr;}
 captions.push_back(state);return state;
}

static bool RefreshCapturedBackdrop(Caption& state,bool active) {
 if(!false)return true;
 return UpdateNativeBackdrop(state.backdrop,active,
  [&](DWORD& value){return nativeDwmGet(state.window,DWMWA_SYSTEMBACKDROP_TYPE,&value,sizeof(value));},
  [&](DWORD value){return originalDwmSet(state.window,DWMWA_SYSTEMBACKDROP_TYPE,&value,sizeof(value));});
}
static bool ForgetCaption(Caption* state,bool restore) {
 if(GetPropW(state->window,captionProperty)==state) {

  if(restore&&IsWindow(state->window)) {
   if(state->applied){if(FAILED(originalDwmSet(state->window,DWMWA_CAPTION_COLOR,&state->before,sizeof(state->before))))return false;state->applied=false;}
   if(!RefreshCapturedBackdrop(*state,false))return false;
  }
  RemovePropW(state->window,captionProperty);
 }
 captions.erase(std::remove(captions.begin(),captions.end(),state),captions.end());delete state;return true;
}
static void RefreshCaptions() {
 std::lock_guard guard(captionsMutex);bool active=enabled.load()&&!HighContrast();
 for(auto it=captions.begin();it!=captions.end();) {
  auto state=*it;
  if(!IsWindow(state->window)||GetPropW(state->window,captionProperty)!=state){ForgetCaption(state,false);it=captions.begin();continue;}
  COLORREF color=active?([]{auto c=CanvasColor();return RGB(c.R,c.G,c.B);}()):state->before;

  if(SUCCEEDED(originalDwmSet(state->window,DWMWA_CAPTION_COLOR,&color,sizeof(color)))) {
   state->applied=active;if(!RefreshCapturedBackdrop(*state,active))Log(236);
  }
  ++it;
 }
}

// Paint and unowned Notepad windows preserve native backdrop requests. A known
// Notepad caption owner keeps the application's latest readable backdrop as
// its restore baseline. No AppWindow access, title mode or geometry changes.

static HRESULT WINAPI DwmCaptionHook(HWND window,DWORD attribute,LPCVOID value,DWORD size) {
 if(false&&attribute==DWMWA_SYSTEMBACKDROP_TYPE&&value&&size==sizeof(DWORD)&&CaptionWindow(window)) {
  std::lock_guard guard(captionsMutex);auto state=OwnedCaption(window);
  if(state&&!state->backdrop.changed) {
   DWORD requested=0;memcpy(&requested,value,sizeof(requested));
   bool active=enabled.load()&&!HighContrast();
   if(requested<=DWMSBT_TABBEDWINDOW&&RefreshCapturedBackdrop(*state,active)&&!state->backdrop.changed) {
    DWORD none=DWMSBT_NONE;auto result=originalDwmSet(window,attribute,active?&none:value,size);
    if(SUCCEEDED(result)){state->backdrop.before=requested;state->backdrop.owned=active;}
    return result;
   }
  }
 }
 if(publicCaptionWrite||attribute!=DWMWA_CAPTION_COLOR||!value||size!=sizeof(COLORREF)||!CaptionWindow(window))return originalDwmSet(window,attribute,value,size);
 std::lock_guard guard(captionsMutex);COLORREF requested;memcpy(&requested,value,sizeof(requested));
 auto state=OwnedCaption(window);bool captured=!state;bool active=enabled.load()&&!HighContrast();
 if(!state&&active)state=CaptureCaption(window,requested);
 COLORREF color=state&&active?([]{auto c=CanvasColor();return RGB(c.R,c.G,c.B);}()):requested;
 HRESULT result=originalDwmSet(window,attribute,&color,size);
 if(SUCCEEDED(result)&&state){state->before=requested;state->applied=active;if(!RefreshCapturedBackdrop(*state,active))Log(236);}
 else if(FAILED(result)&&state&&captured)ForgetCaption(state,false);
 return result;
}
static HWND WINAPI CreateCaptionHook(DWORD exStyle,LPCWSTR type,LPCWSTR title,DWORD style,int x,int y,int width,int height,HWND parent,HMENU menu,HINSTANCE instance,LPVOID parameter) {
 HWND window=originalCreateWindow(exStyle,type,title,style,x,y,width,height,parent,menu,instance,parameter);
 if(window&&CaptionWindow(window)&&enabled.load()&&!HighContrast()) {
  {std::lock_guard guard(captionsMutex);CaptureCaption(window,DWMWA_COLOR_DEFAULT);}
  if(ReviewedRuntime()&&EnsureChannel())Schedule();
 }
 RefreshCaptions();return window;
}
static BOOL WINAPI DestroyCaptionHook(HWND window) {
 {std::lock_guard guard(captionsMutex);if(auto state=OwnedCaption(window))ForgetCaption(state,false);}
 return originalDestroyWindow(window);
}
static void RestoreCaptions() {std::lock_guard guard(captionsMutex);auto copy=captions;for(auto state:copy)if(!ForgetCaption(state,true))PinForCleanup();}
static std::mutex admission;
static thread_local bool admitting=false;
static void Admit(){
 if(admitting)return;
 // An app activation must not race past the worker installing its hooks.
 // Same-thread reentrancy returns above; other threads wait for admission.
 std::unique_lock lock(admission);
 if((factoryReady.load()&&activationReady.load())||!ReviewedRuntime())return;
 admitting=true;

 try{
  auto install=[]<unsigned N,typename T>(const wchar_t* type){
   if(hooked[N].load())return;
   auto api=Factory(type).as<T>();auto table=*reinterpret_cast<void***>(get_abi(api));auto function=table[6];
   HMODULE module=nullptr;
   if(GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,reinterpret_cast<LPCWSTR>(function),&module)&&module==GetModuleHandleW(L"Microsoft.UI.Xaml.dll")){
    Log(250,N,Identity(api,Factory(type).as<T>()));
    factoryIdentity[N]=api;factoryTable[N]=table;factoryFunction[N]=function;
    // Several exact-runtime factories share one constructor implementation.
    // Admit each factory identity, but install one hook per function address.
    for(unsigned at=0;at<factoryCount;at++)if(at!=N&&hooked[at].load()&&factoryFunction[at].load()==function){hooked[N]=true;Log(10+N,2);return;}
    if(Wh_SetFunctionHook(function,reinterpret_cast<void*>(CreateHook<N>),reinterpret_cast<void**>(&originalCreate[N]))&&Wh_ApplyHookOperations()){hooked[N]=true;Log(10+N,1);}
   }
  };
  install.operator()<0,IFrameworkElementFactory>(L"Microsoft.UI.Xaml.FrameworkElement");
  install.operator()<1,IControlFactory>(L"Microsoft.UI.Xaml.Controls.Control");
  install.operator()<2,IUserControlFactory>(L"Microsoft.UI.Xaml.Controls.UserControl");
  install.operator()<3,IPageFactory>(L"Microsoft.UI.Xaml.Controls.Page");
  install.operator()<4,IGridFactory>(L"Microsoft.UI.Xaml.Controls.Grid");
#if !J3W1_LEGACY_XAML
  install.operator()<5,IDesktopWindowXamlSourceFactory>(L"Microsoft.UI.Xaml.Hosting.DesktopWindowXamlSource");
#else
  hooked[5]=true; // Legacy islands expose activation, not a composable factory.
#endif
#if !J3W1_LEGACY_XAML
  install.operator()<6,IWindowFactory>(L"Microsoft.UI.Xaml.Window");
#else
  hooked[6]=true;
#endif
  auto installActivation=[]<unsigned N>(wchar_t const* type) {
   if(activationHooked[N].load())return;
   auto api=Factory(type);auto table=*reinterpret_cast<void***>(get_abi(api));auto function=table[6];
   if(!RuntimeFunction(function))return;
   Log(251,N,Identity(api,Factory(type)));
   activationIdentity[N]=api;activationTable[N]=table;activationFunction[N]=function;
   for(unsigned at=0;at<factoryCount;at++)if(at!=N&&activationHooked[at].load()&&activationFunction[at].load()==function){activationHooked[N]=true;return;}
   if(Wh_SetFunctionHook(function,reinterpret_cast<void*>(ActivationHook<N>),reinterpret_cast<void**>(&originalActivate[N]))&&Wh_ApplyHookOperations()){activationHooked[N]=true;Log(244,N);}
  };
  installActivation.operator()<0>(L"Microsoft.UI.Xaml.FrameworkElement");
  installActivation.operator()<1>(L"Microsoft.UI.Xaml.Controls.Control");
  installActivation.operator()<2>(L"Microsoft.UI.Xaml.Controls.UserControl");
  installActivation.operator()<3>(L"Microsoft.UI.Xaml.Controls.Page");
  installActivation.operator()<4>(L"Microsoft.UI.Xaml.Controls.Grid");
  installActivation.operator()<5>(L"Microsoft.UI.Xaml.Hosting.DesktopWindowXamlSource");
#if !J3W1_LEGACY_XAML
  installActivation.operator()<6>(L"Microsoft.UI.Xaml.Window");
#else
  activationHooked[6]=true;
#endif
  bool activated=true;for(auto& item:activationHooked)if(!item.load())activated=false;activationReady=activated;
  bool all=true;for(auto& item:hooked)if(!item.load())all=false;factoryReady=all;
 }catch(hresult_error const& e){Log(19,e.code().value);}catch(...){Log(18);}admitting=false;
}
// Observe the public activation boundary before the app obtains its first
// island/window factory. Polling alone can miss packaged-app startup.
using XamlFactory=HRESULT(WINAPI*)(void*,void**);
static XamlFactory originalXamlFactory=nullptr;
static decltype(&GetProcAddress) originalGetProcAddress=nullptr;
using RoFactory=HRESULT(WINAPI*)(void*,REFIID,void**); static RoFactory originalRoFactory=nullptr;
static HRESULT WINAPI XamlFactoryHook(void* name,void** factory) {
 auto result=originalXamlFactory(name,factory);if(SUCCEEDED(result))Admit();return result;
}
static FARPROC WINAPI ProcAddressHook(HMODULE module,LPCSTR name) {
 auto result=originalGetProcAddress(module,name);
 if(result&&reinterpret_cast<ULONG_PTR>(name)>0xffff&&strcmp(name,"DllGetActivationFactory")==0
  &&module==GetModuleHandleW(L"Microsoft.UI.Xaml.dll")&&ReviewedRuntime()) {
  originalXamlFactory=reinterpret_cast<XamlFactory>(result);return reinterpret_cast<FARPROC>(XamlFactoryHook);
 }
 return result;
}
static HRESULT WINAPI RoFactoryHook(void* name,REFIID iid,void** factory) {
 auto result=originalRoFactory(name,iid,factory);if(SUCCEEDED(result))Admit();return result;
}

// A failed hook admission must release the stop event even when the engine
// never calls Uninit for an Init that returned FALSE.
static bool StartHooks() {
 if(rootDiscovery.load()||!channels.empty())return false;
 factoryReady=false;activationReady=false;contentReady=false;windowContentReady=false;
 for(unsigned at=0;at<factoryCount;++at){hooked[at]=false;activationHooked[at]=false;factoryFunction[at]=nullptr;activationFunction[at]=nullptr;factoryTable[at]=nullptr;activationTable[at]=nullptr;factoryIdentity[at]=nullptr;activationIdentity[at]=nullptr;originalCreate[at]=nullptr;originalActivate[at]=nullptr;}
 originalIslandContent=nullptr;originalWindowContent=nullptr;
 enabled=Wh_GetIntSetting(L"enabled")!=0;
 dispatchMessage=RegisterWindowMessageW(L"j3w1-paint-chrome");
 stopDiscovery=CreateEventW(nullptr,TRUE,FALSE,nullptr);
 auto module=GetModuleHandleW(L"combase.dll");
 auto roFactory=module?GetProcAddress(module,"RoGetActivationFactory"):nullptr;
 bool admitted=roFactory&&dispatchMessage&&stopDiscovery
  &&Wh_SetFunctionHook(reinterpret_cast<void*>(GetProcAddress),reinterpret_cast<void*>(ProcAddressHook),reinterpret_cast<void**>(&originalGetProcAddress))
  &&Wh_SetFunctionHook(reinterpret_cast<void*>(roFactory),reinterpret_cast<void*>(RoFactoryHook),reinterpret_cast<void**>(&originalRoFactory))
  &&Wh_SetFunctionHook(reinterpret_cast<void*>(CreateWindowExW),reinterpret_cast<void*>(CreateCaptionHook),reinterpret_cast<void**>(&originalCreateWindow))
  &&Wh_SetFunctionHook(reinterpret_cast<void*>(DestroyWindow),reinterpret_cast<void*>(DestroyCaptionHook),reinterpret_cast<void**>(&originalDestroyWindow))
  &&Wh_SetFunctionHook(reinterpret_cast<void*>(DwmSetWindowAttribute),reinterpret_cast<void*>(DwmCaptionHook),reinterpret_cast<void**>(&originalDwmSet));
 if(!admitted){enabled=false;if(stopDiscovery)CloseHandle(stopDiscovery);stopDiscovery=nullptr;}
 return admitted;
}
BOOL Wh_ModInit(){bool ready=ReviewedPackage()&&StartHooks();Log(253,ready,enabled.load());return ready;}
void Wh_ModAfterInit(){StartRootDiscovery();Admit();discovery=CreateThread(nullptr,0,[](LPVOID)->DWORD{
 // An unsupported process has no factories to admit. Avoid initializing
 // COM and its process-wide handle cache until the exact runtime is present.
 bool apartment=false;
 try{for(unsigned i=0;i<50&&!factoryReady.load()&&WaitForSingleObject(stopDiscovery,100)==WAIT_TIMEOUT;i++){
  if(!ReviewedRuntime())continue;
  if(!apartment){init_apartment(apartment_type::multi_threaded);apartment=true;}
  Admit();
 }}catch(hresult_error const& error){Log(7,static_cast<unsigned>(error.code().value));}catch(...){}
 if(apartment)uninit_apartment();return 0;
 },nullptr,0,nullptr);}
void Wh_ModUninit(){enabled=false;StopRootDiscovery();RestoreCaptions();SetEvent(stopDiscovery);if(discovery){WaitForSingleObject(discovery,INFINITE);CloseHandle(discovery);discovery=nullptr;}std::vector<HWND> copy;{std::lock_guard guard(channelMutex);copy=channels;}for(HWND window:copy)if(IsWindow(window))SendMessageW(window,dispatchMessage,1,0);CloseHandle(stopDiscovery);stopDiscovery=nullptr;for(auto& value:factoryIdentity)value=nullptr;for(auto& value:activationIdentity)value=nullptr;}
void Wh_ModSettingsChanged(){enabled=Wh_GetIntSetting(L"enabled")!=0;if(enabled.load())RefreshRootDiscovery();RefreshCaptions();std::vector<HWND> copy;{std::lock_guard guard(channelMutex);copy=channels;}for(HWND window:copy)if(IsWindow(window))SendMessageW(window,dispatchMessage,0,0);}
