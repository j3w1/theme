// ==WindhawkMod==
// @id j3w1-paint-chrome
// @name j3w1 Paint chrome
// @description Exact-package Paint chrome resources; document and artwork colors remain native
// @version 1.0.4
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
#undef GetCurrentTime
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>
#include <winrt/Microsoft.UI.Xaml.h>
#include <winrt/Microsoft.UI.Windowing.h>
#include <winrt/Microsoft.UI.Dispatching.h>
#include <winrt/Microsoft.UI.Xaml.Hosting.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/Microsoft.UI.Xaml.Controls.Primitives.h>
#include <winrt/Microsoft.UI.Xaml.Shapes.h>
#include <winrt/Microsoft.UI.Xaml.Markup.h>
#include <winrt/Microsoft.UI.Xaml.Media.h>
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
};
static bool Same(Color a,Color b){return a.A==b.A&&a.R==b.R&&a.G==b.G&&a.B==b.B;}
static bool Identity(ProjectedObject const& a,ProjectedObject const& b){
 return a&&b&&get_abi(a.as<Windows::Foundation::IUnknown>())==get_abi(b.as<Windows::Foundation::IUnknown>());
}
static bool HighContrast(){HIGHCONTRASTW value{sizeof(value)};
 return !SystemParametersInfoW(SPI_GETHIGHCONTRAST,sizeof(value),&value,0)||(value.dwFlags&HCF_HIGHCONTRASTON);}
static std::atomic<int> runtimeStatus{0};
static bool ReviewedPackage(){
    UINT32 length=0;
    if(GetCurrentPackageFullName(&length,nullptr)!=ERROR_INSUFFICIENT_BUFFER||length>512)return false;
    std::vector<wchar_t> name(length);
    if(GetCurrentPackageFullName(&length,name.data())!=ERROR_SUCCESS)return false;
    for(auto allowed:{L"Microsoft.Paint_11.2605.81.0_x64__8wekyb3d8bbwe"})if(wcscmp(name.data(),allowed)==0)return true;
    return false;
}
static bool ReviewedRuntime(){
    if(int status=runtimeStatus.load())return status==1;
    auto module=GetModuleHandleW(L"Microsoft.UI.Xaml.dll");if(!module)return false;
    wchar_t path[32768]{};DWORD length=GetModuleFileNameW(module,path,std::size(path));
    if(!length||length>=std::size(path))return false;
    std::wstring name=path;
    if(name.find(L"\\Microsoft.WindowsAppRuntime.2_2.5.1.0_x64__8wekyb3d8bbwe\\")==std::wstring::npos){runtimeStatus=-1;return false;}
    HANDLE file=CreateFileW(path,GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr);
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
                valid=actual=="aad12524765e6fb63f0ae26a45a9ba3104f24fde66413d8a3036fbed74a1e990";
            }
        }
    }
    if(hash)BCryptDestroyHash(hash);if(algorithm)BCryptCloseAlgorithmProvider(algorithm,0);CloseHandle(file);
    runtimeStatus=valid?1:-1;return valid;
}

static Windows::Foundation::IActivationFactory Factory(wchar_t const* name) {
 auto module=GetModuleHandleW(L"Microsoft.UI.Xaml.dll");
 auto getFactory=reinterpret_cast<HRESULT(WINAPI*)(void*,void**)>(module?GetProcAddress(module,"DllGetActivationFactory"):nullptr);
 if(!getFactory)throw hresult_error(E_NOINTERFACE);
 Windows::Foundation::IActivationFactory factory{nullptr};hstring type=name;
 check_hresult(getFactory(get_abi(type),put_abi(factory)));return factory;
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

struct Root { weak_ref<FrameworkElement> element; weak_ref<FrameworkElement> backgroundElement; weak_ref<DesktopWindowXamlSource> source; weak_ref<Window> window; event_token layout{}; ResourceDictionary owner{nullptr},overlay{nullptr}; ProjectedObject themeBefore{nullptr}; bool themeTouched=false; SystemBackdrop backdropBefore{nullptr}; bool backdropTracked=false; DependencyProperty backgroundProperty{nullptr}; ProjectedObject backgroundBefore{nullptr}; SolidColorBrush backgroundApplied{nullptr}; std::vector<Palette> palette; std::vector<Visual> changes; std::deque<OwnedThemeRefresh> refreshes; std::deque<ControlResources> controls; };
struct PendingRoot { weak_ref<FrameworkElement> element; unsigned attempts=0; };
// The app owns its custom title composition. Do not acquire AppWindow.TitleBar
// or write its public color properties: the inspected Notepad runtime replaces
// the tab strip with its generic custom title bar when that path is used.

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

// Readable public caption colors are supported only by this admitted Paint
// composition. Notepad's custom tab caption uses the captured native path.
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
 if(slot>=std::size(colors))throw hresult_invalid_argument();
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

struct ThreadState { std::vector<std::unique_ptr<PublicCaption>> publicCaptions;  ControlResources keyTips; HWND channel=nullptr; WNDPROC original=nullptr; std::deque<Root> roots; std::vector<OwnedNativeBrush> nativeBrushes; std::vector<PendingRoot> pending; bool busy=false,queued=false,cleaning=false; unsigned ticks=0; };
static thread_local ThreadState* uiState=nullptr;
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
static bool Restore(Root& root) {
 bool restored=true;
 for(auto& entry:root.controls)restored=RestoreControlResources(entry)&&restored;
 for(auto& entry:root.refreshes)restored=RestoreThemeRefresh(entry)&&restored;
 if(root.themeTouched)try{RefreshThemeResources(root);}catch(...){restored=false;}
 auto element=root.backgroundElement.get();
 bool backgroundOwned=false;
 try{backgroundOwned=element&&root.backgroundApplied&&Identity(element.GetValue(root.backgroundProperty),root.backgroundApplied);}catch(...){restored=false;}
 if(root.backdropTracked)try {
  if(auto source=root.source.get();source&&!source.SystemBackdrop())source.SystemBackdrop(root.backdropBefore);
  if(auto window=root.window.get();window&&!window.SystemBackdrop())window.SystemBackdrop(root.backdropBefore);
  root.backdropTracked=false;root.backdropBefore=nullptr;
 }catch(...){restored=false;}
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
 if(auto source=root.source.get()) {
  if(auto value=source.SystemBackdrop()) {root.backdropBefore=value;source.SystemBackdrop(nullptr);root.backdropTracked=true;}
 } else if(auto window=root.window.get()) {
  if(auto value=window.SystemBackdrop()) {root.backdropBefore=value;window.SystemBackdrop(nullptr);root.backdropTracked=true;}
 }
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
static void ApplyRootBackground(Root& root) {
 auto element=root.element.get();if(!element)return;
 // Select the app's rendered backing before walking outward into scroll
 // wrappers. Paint's outer ScrollViewer does not consume its own Background.
 bool paintBacking=false;
 if(get_class_name(element)==L"PaintUI.AppChrome"&&VisualTreeHelper::GetChildrenCount(element)==1) {
  auto child=VisualTreeHelper::GetChild(element,0).try_as<Grid>();
  if(child&&PaintBackingAdmission(std::wstring_view{get_class_name(element)},std::wstring_view{get_class_name(child)},1,Identity(element.XamlRoot(),child.XamlRoot()))){element=child;paintBacking=true;}
 }
 if(!paintBacking) {
  auto boundary=ChromeBackgroundBoundary(element);
  if(!Identity(boundary,element))element=boundary;
  // Only the immediate content panel of an admitted root, never all panels.
  if(auto control=element.try_as<UserControl>())if(auto panel=control.Content().try_as<Panel>())element=panel;
 }
 // This exact package's Settings Page forwards rendering to a ScrollViewer;
 // its own Control.Background is not consumed by that child template.
 if(get_class_name(element)==L"NotepadXamlUI.NotepadSettingsPage"&&VisualTreeHelper::GetChildrenCount(element)==1) {
  auto child=VisualTreeHelper::GetChild(element,0).try_as<ScrollViewer>();
  if(child&&child.Name()==L"RootScrollViewer")element=child;
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
static const wchar_t* NativeFocusBrushKey(Kind kind,bool control) {
 if(!control)return nullptr;
 return kind==Kind::FocusPrimary?L"SystemControlFocusVisualPrimaryBrush":kind==Kind::FocusSecondary?L"SystemControlFocusVisualSecondaryBrush":nullptr;
}
static Palette const* TemplateSurface(Root const& root,DependencyObject const& object,Kind kind,Brush const& brush) {

 if(auto key=NativeFocusBrushKey(kind,object.try_as<Control>()!=nullptr)) {
  for(auto const& item:root.palette)if(wcscmp(item.rule->key,key)==0)return &item;
  return nullptr;
 }
 if(kind!=Kind::Background&&kind!=Kind::Border)return nullptr;
 auto solid=brush.try_as<SolidColorBrush>();if(!solid)return nullptr;
 auto parent=VisualTreeHelper::GetParent(object);if(!parent)return nullptr;
 auto type=get_class_name(object),owner=get_class_name(parent);auto c=solid.Color();
const wchar_t* key=PaintChromeKey(std::wstring_view{type},std::wstring_view{owner},kind,c);
 // Observed on a fresh exact-package window: this immediate template Grid
 // paints the whole toolbar independently of MainMenuBar.Background.
 if(auto mapped=NotepadToolbarSurfaceKey(std::wstring_view{get_class_name(root.element.get())},std::wstring_view{type},std::wstring_view{owner},kind,c))key=mapped;

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

static bool StandardChrome(DependencyObject const& object) {
 return object.try_as<Microsoft::UI::Xaml::Controls::Primitives::ButtonBase>()
  ||object.try_as<MenuBarItem>()||object.try_as<MenuFlyoutItem>()||object.try_as<MenuFlyoutSubItem>()
  ||object.try_as<MenuFlyoutPresenter>()||object.try_as<ToggleSwitch>()||object.try_as<ComboBox>()
  ||object.try_as<ListViewItem>()||object.try_as<Slider>()||object.try_as<TextBlock>()||object.try_as<IconElement>();
}
static void RefreshChromeControl(Root& root,DependencyObject const& object) {
 if(!StandardChrome(object))return;
 auto element=object.try_as<FrameworkElement>();if(!element||!element.IsLoaded())return;
 for(auto& entry:root.controls)if(Identity(entry.element.get(),element)){if(!entry.refresh.complete)RefreshThemeSource(entry.refresh);return;}
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

static void Bridge(Root& root) {
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


  auto solid=brush.try_as<SolidColorBrush>();if(!solid||!uiState)return;
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
 if(auto element=root.element.get()) {
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
static void Track(UIElement const& content,DesktopWindowXamlSource const& source,Window const& window=nullptr);


static void WriteOwnedCaption(PublicCaption const& caption,unsigned slot,CaptionColor const& color) {
 if(!OwnsPublicCaptionWindow(caption))throw hresult_error(E_HANDLE);
 WriteCaption(caption.bar,slot,color);
}
static bool RestorePublicCaption(PublicCaption& caption,bool release=true) noexcept {
 if(!OwnsPublicCaptionWindow(caption))return true;
 CaptionWriteGuard guard;bool restored=true;
 for(unsigned slot=0;slot<caption.slots.size();slot++)
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
    // Decline custom title bars. Never alter geometry, drag regions or artwork.
    if(!bar||bar.ExtendsContentIntoTitleBar())return TRUE;
    auto caption=std::make_unique<PublicCaption>();caption->window=window;caption->bar=bar;
    for(unsigned slot=0;slot<caption->slots.size();slot++)caption->slots[slot].before=ReadCaption(bar,slot);
    // Allocate vector storage before attaching its stable ownership token.
    state.publicCaptions.push_back(std::move(caption));
    if(!SetPropW(window,publicCaptionProperty,state.publicCaptions.back().get()))state.publicCaptions.pop_back();
   }catch(...){Log(230);}
   return TRUE;
  },reinterpret_cast<LPARAM>(&state));
  CaptionWriteGuard guard;
  for(auto& caption:state.publicCaptions) {
   if(!OwnsPublicCaptionWindow(*caption))continue;
   if(caption->declined||caption->bar.ExtendsContentIntoTitleBar()) {
    caption->declined=true;RestorePublicCaption(*caption,false);continue;
   }
   bool complete=true;
   for(unsigned slot=0;slot<caption->slots.size();slot++) {
    auto color=box_value(CaptionRoleColor(slot)).as<CaptionColor>();
    complete=UpdateCaptionSlot(caption->slots[slot],color,true,
     [&]{return ReadCaption(caption->bar,slot);},[&](auto const& value){WriteOwnedCaption(*caption,slot,value);})&&complete;
   }
   // Retain failed restoration data for the existing UI-thread retry path.
   if(!complete){caption->declined=true;RestorePublicCaption(*caption,false);Log(231);}
  }
 }catch(...){Log(232);RestorePublicCaptions(state);}
}
static void Refresh(ThreadState& state) noexcept {
 if(state.busy)return;state.busy=true;state.queued=false;
 ApplyPublicCaptions(state);
 const bool active=enabled.load()&&!HighContrast();
 if(!active){RestoreKeyTips(state);RestoreNativeBrushes(state.nativeBrushes);}
 else if(!state.roots.empty())ApplyKeyTips(state);
 for(auto it=state.pending.begin();it!=state.pending.end();) {
  bool finished=!enabled.load()||HighContrast();
  try {
   if(auto element=it->element.get()) {
    if(auto xaml=element.XamlRoot();xaml&&xaml.Content()) {Track(xaml.Content(),nullptr);finished=true;}
   } else finished=true;
  }catch(...){Log(96);}
  if(finished||++it->attempts>=120)it=state.pending.erase(it);else ++it;
 }
  const size_t rootCount=state.roots.size();
  for(size_t at=0;at<rootCount;at++)try {
  auto& root=state.roots[at];
  if(!enabled.load()||HighContrast()||!root.element.get())Restore(root);
  else if(Prepare(root)){ApplyBackdrop(root);ApplyRootBackground(root);Bridge(root);}
 }catch(hresult_error const& error){Log(98,static_cast<unsigned>(error.code().value));Restore(state.roots[at]);}
 catch(...){Log(97);Restore(state.roots[at]);}
 for(auto it=state.roots.begin();it!=state.roots.end();) {
  if(!it->element.get()&&Restore(*it))it=state.roots.erase(it);else ++it;
 }
 state.ticks++;state.busy=false;
}
static std::atomic<bool> modulePinned{false};
static void PinForCleanup() noexcept {if(!modulePinned.exchange(true)){HMODULE module=nullptr;GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS,reinterpret_cast<LPCWSTR>(PinForCleanup),&module);Log(178,module!=nullptr);}}
static void Schedule() {
 if(uiState&&!uiState->cleaning&&!uiState->busy&&!uiState->queued){uiState->queued=true;PostMessageW(uiState->channel,dispatchMessage,0,0);}
}

[[clang::no_destroy]] static std::vector<ThreadState*> retiredCleanup;
static bool RestoreThreadState(ThreadState& state) noexcept {
 bool publicRestored=RestorePublicCaptions(state);
 bool restored=RestoreKeyTips(state)&&publicRestored;
 restored=RestoreNativeBrushes(state.nativeBrushes)&&restored;
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
  auto admitted=element;auto ancestor=VisualTreeHelper::GetParent(element);
  for(unsigned depth=0;ancestor&&depth<32;++depth,ancestor=VisualTreeHelper::GetParent(ancestor)) {
   auto parent=ancestor.try_as<FrameworkElement>();
   if(!parent||!Identity(parent.XamlRoot(),xaml))break;
   if(RootCandidateClass(std::wstring_view{get_class_name(parent)}))admitted=parent;
  }
  auto content=xaml.Content().try_as<FrameworkElement>();
  Track(content&&RootCandidateClass(std::wstring_view{get_class_name(content)})?content:admitted,nullptr);return;
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
 HRESULT STDMETHODCALLTYPE OnVisualTreeChange(ParentChildRelation,VisualElement element,VisualMutationType mutation) noexcept final {
  struct Activity {std::atomic<unsigned>& count;Activity(std::atomic<unsigned>& value):count(value){++count;}~Activity(){--count;}} activity(state->callbacks);
  if(state->stopping.load()||!enabled.load()||mutation!=VisualMutationType::Add||!element.Type)return S_OK;
  // Type is metadata. Do not query names, document contents or data controls.
  std::wstring_view type(element.Type,SysStringLen(element.Type));if(!RootCandidateClass(type))return S_OK;
  try {
   com_ptr<IXamlDiagnostics> diagnostics;{std::lock_guard guard(state->mutex);diagnostics=state->diagnostics;}
   if(!diagnostics)return S_OK;
   com_ptr<::IInspectable> instance;check_hresult(diagnostics->GetIInspectableFromHandle(element.Handle,instance.put()));
   Windows::Foundation::IInspectable value{nullptr};copy_from_abi(value,instance.get());
   auto framework=value.try_as<FrameworkElement>();
   if(framework&&DiscoveryAdmission(type,framework.DispatcherQueue().HasThreadAccess(),!state->stopping.load()&&enabled.load()))
    ObserveRoot(framework);
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
  init_apartment(apartment_type::multi_threaded);apartment=true;
  for(unsigned attempt=0;attempt<50&&!state->stopping.load();++attempt) {
   if(ReviewedRuntime()) {
    auto runtime=GetModuleHandleW(L"Microsoft.UI.Xaml.dll");HMODULE self=nullptr;
    wchar_t path[32768]{},runtimePath[32768]{};
    DWORD runtimeLength=GetModuleFileNameW(runtime,runtimePath,std::size(runtimePath));
    if(!runtimeLength||runtimeLength>=std::size(runtimePath)
     ||!GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,reinterpret_cast<LPCWSTR>(RootDiscoveryWorker),&self))break;
    DWORD selfLength=GetModuleFileNameW(self,path,std::size(path));if(!selfLength||selfLength>=std::size(path))break;
    std::wstring bridgePath=runtimePath;auto slash=bridgePath.find_last_of(L"\\");if(slash==std::wstring::npos)break;
    bridgePath.resize(slash+1);bridgePath+=L"Microsoft.Internal.FrameworkUdk.dll";
    if(!ReviewedDiagnosticsBridge(bridgePath))break;
    auto bridge=LoadLibraryExW(bridgePath.c_str(),nullptr,LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR|LOAD_LIBRARY_SEARCH_SYSTEM32);
    if(!bridge)break;
    auto initialize=reinterpret_cast<HRESULT(WINAPI*)(LPCWSTR,DWORD,LPCWSTR,LPCWSTR,CLSID,LPCWSTR)>(GetProcAddress(bridge,"InitializeXamlDiagnosticsEx"));
    HRESULT result=initialize?initialize(L"WinUIVisualDiagConnection1",GetCurrentProcessId(),runtimePath,path,rootDiscoveryClsid,nullptr):E_NOINTERFACE;
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
 auto element=value.try_as<FrameworkElement>();
 if(element&&RootCandidateClass(std::wstring_view{get_class_name(element)})
   &&element.DispatcherQueue().HasThreadAccess())ObserveRoot(element);
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
   mask|=1;if(element.DispatcherQueue().HasThreadAccess())mask|=8;
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
   mask|=1;if(element.DispatcherQueue().HasThreadAccess())mask|=8;
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
  if(auto window=value.try_as<Window>();window&&window.Content())Track(window.Content(),nullptr,window);
  if(auto element=value.try_as<FrameworkElement>())ObserveRoot(element);
 }catch(hresult_error const& error){Log(242,static_cast<unsigned>(error.code().value));}
 catch(...){Log(243);}
 return result;
}

// Caption colors are write-only. Existing windows with unknown state are not
// recolored until an application request supplies a baseline. Windows created
// after hook installation have a known default baseline; creation-time requests
// are captured by the same hook before CreateWindowEx returns.
struct Caption { HWND window; COLORREF before=DWMWA_COLOR_DEFAULT; bool applied=false; };
static constexpr PCWSTR captionProperty=L"j3w1-paint-chrome-caption-owner";
[[clang::no_destroy]] static std::vector<Caption*> captions;
[[clang::no_destroy]] static std::mutex captionsMutex;
static decltype(&CreateWindowExW) originalCreateWindow=nullptr;
static decltype(&DestroyWindow) originalDestroyWindow=nullptr;
static decltype(&DwmSetWindowAttribute) originalDwmSet=nullptr;
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
static bool ForgetCaption(Caption* state,bool restore) {
 if(GetPropW(state->window,captionProperty)==state) {
  if(restore&&state->applied&&IsWindow(state->window)&&FAILED(originalDwmSet(state->window,DWMWA_CAPTION_COLOR,&state->before,sizeof(state->before))))return false;
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
  if(SUCCEEDED(originalDwmSet(state->window,DWMWA_CAPTION_COLOR,&color,sizeof(color))))state->applied=active;
  ++it;
 }
}
// Preserve native backdrop requests. Opaque XAML backing and a captured
// caption-color baseline provide black surfaces without exposing other windows.
static HRESULT WINAPI DwmCaptionHook(HWND window,DWORD attribute,LPCVOID value,DWORD size) {
 if(publicCaptionWrite||attribute!=DWMWA_CAPTION_COLOR||!value||size!=sizeof(COLORREF)||!CaptionWindow(window))return originalDwmSet(window,attribute,value,size);
 std::lock_guard guard(captionsMutex);COLORREF requested;memcpy(&requested,value,sizeof(requested));
 auto state=OwnedCaption(window);bool captured=!state;bool active=enabled.load()&&!HighContrast();
 if(!state&&active)state=CaptureCaption(window,requested);
 COLORREF color=state&&active?([]{auto c=CanvasColor();return RGB(c.R,c.G,c.B);}()):requested;
 HRESULT result=originalDwmSet(window,attribute,&color,size);
 if(SUCCEEDED(result)&&state){state->before=requested;state->applied=active;}
 else if(FAILED(result)&&state&&captured)ForgetCaption(state,false);
 return result;
}
static HWND WINAPI CreateCaptionHook(DWORD exStyle,LPCWSTR type,LPCWSTR title,DWORD style,int x,int y,int width,int height,HWND parent,HMENU menu,HINSTANCE instance,LPVOID parameter) {
 HWND window=originalCreateWindow(exStyle,type,title,style,x,y,width,height,parent,menu,instance,parameter);
 if(window&&CaptionWindow(window)) {
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
  install.operator()<5,IDesktopWindowXamlSourceFactory>(L"Microsoft.UI.Xaml.Hosting.DesktopWindowXamlSource");
  install.operator()<6,IWindowFactory>(L"Microsoft.UI.Xaml.Window");
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
  installActivation.operator()<6>(L"Microsoft.UI.Xaml.Window");
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
 try{init_apartment(apartment_type::multi_threaded);try{for(unsigned i=0;i<50&&!factoryReady.load()&&WaitForSingleObject(stopDiscovery,100)==WAIT_TIMEOUT;i++)Admit();}catch(...){}uninit_apartment();}
 catch(hresult_error const& error){Log(7,static_cast<unsigned>(error.code().value));}catch(...){}return 0;
 },nullptr,0,nullptr);}
void Wh_ModUninit(){enabled=false;StopRootDiscovery();RestoreCaptions();SetEvent(stopDiscovery);if(discovery){WaitForSingleObject(discovery,INFINITE);CloseHandle(discovery);discovery=nullptr;}std::vector<HWND> copy;{std::lock_guard guard(channelMutex);copy=channels;}for(HWND window:copy)if(IsWindow(window))SendMessageW(window,dispatchMessage,1,0);CloseHandle(stopDiscovery);stopDiscovery=nullptr;for(auto& value:factoryIdentity)value=nullptr;for(auto& value:activationIdentity)value=nullptr;}
void Wh_ModSettingsChanged(){enabled=Wh_GetIntSetting(L"enabled")!=0;if(enabled.load())RefreshRootDiscovery();RefreshCaptions();std::vector<HWND> copy;{std::lock_guard guard(channelMutex);copy=channels;}for(HWND window:copy)if(IsWindow(window))SendMessageW(window,dispatchMessage,0,0);}
