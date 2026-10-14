import { defaultTokens } from "./helpers/tokens.mjs";
import assert from 'node:assert/strict';
import test from 'node:test';
import {readJson} from '../scripts/lib/fs.mjs';
import {stylerSettings} from '../ports/windows/src/compatibility.mjs';

const ids=['windows-11-taskbar-styler','windows-11-start-menu-styler',
 'windows-11-file-explorer-styler','windows-11-notification-center-styler','windows-11-settings-styler'];

test('every supported shell host receives the common menu controls and resource palette',async()=>{
 const host=await readJson('ports/windows/host.json');
 const mapping=await readJson('ports/windows/mapping.json');
 const tokens=await defaultTokens();
 assert.deepEqual(host.stylers.map(x=>x.id),ids);
 const expectedResources={MenuFlyoutPresenterBackground:'color.surface.raised',
  MenuFlyoutPresenterBorderBrush:'color.border.overlay',MenuFlyoutSeparatorBackground:'color.border.divider',
  MenuFlyoutItemForeground:'color.text.default',MenuFlyoutItemForegroundDisabled:'color.text.disabled',
  MenuFlyoutItemBackground:'color.surface.raised',MenuFlyoutItemBackgroundPointerOver:'color.interaction.hover.bg-strong',
  MenuFlyoutItemBackgroundPressed:'color.interaction.pressed.bg',MenuFlyoutItemBackgroundDisabled:'color.surface.raised',
  MenuFlyoutSubItemBackgroundSubMenuOpened:'color.interaction.hover.bg-strong',
  MenuFlyoutItemKeyboardAcceleratorTextForeground:'color.text.muted'};
 for(const [key,role]of Object.entries(expectedResources)){
  assert.equal(host.resources[key],role);
  assert.ok(mapping.mappings[role].includes('windhawk.resource.'+key));
 }
 const menuTargets=new Set(host.menuTargets.map(x=>x.target));
 assert.equal(menuTargets.size,host.menuTargets.length);
 assert.equal(host.menuTargets.filter(x=>/^(?:MenuFlyout|ToggleMenuFlyout)/.test(x.target)).length,9);
 for(const styler of host.stylers){
  assert.ok(!styler.targets.some(x=>/^(?:MenuFlyout|ToggleMenuFlyout)/.test(x.target)),styler.id+' duplicates shared menu controls');
  const payload=await readJson('ports/windows/dist/'+styler.id+'.json');
  // Existing host layouts can use one selector for disjoint properties.
  // The shared menu recipe must appear once, without a second host override.
  for(const target of menuTargets)assert.equal(payload.controlStyles.filter(x=>x.target===target).length,1,styler.id+' duplicates '+target);
  const palette=Object.fromEntries(payload.themeResourceVariables.map(x=>x.split('=')));
  assert.equal(Object.keys(palette).length,payload.themeResourceVariables.length);
  for(const [key,role]of Object.entries(expectedResources))assert.equal(palette[key],tokens[role].css,styler.id+'.'+key);
  for(const rule of host.menuTargets){
   assert.ok(payload.controlStyles.some(x=>x.target===rule.target),styler.id+' misses '+rule.target);
   for(const [property,role]of Object.entries(rule.styles))assert.ok(mapping.mappings[role].includes('windhawk.menu | '+rule.target+' | '+property));
  }
  if(styler.variants){
   const variants=(await readJson('ports/windows/dist/windows-settings.json')).stylerVariants[styler.id];
   for(const layout of Object.keys(variants)){
    const selected=stylerSettings(payload,variants,layout);
    for(const target of menuTargets)assert.equal(selected.controlStyles.filter(x=>x.target===target).length,1,layout+' lost or duplicated '+target);
   }
  }
 }
});

test('shared menu states restore their unhovered color and preserve native interaction',async()=>{
 const host=await readJson('ports/windows/host.json');
 const expected={Normal:'color.surface.raised',PointerOver:'color.interaction.hover.bg-strong',
  Pressed:'color.interaction.pressed.bg',Disabled:'color.surface.raised'};
 for(const type of ['MenuFlyoutItem','MenuFlyoutSubItem','ToggleMenuFlyoutItem']){
  const state=host.menuTargets.find(x=>x.target===type+' > Grid#LayoutRoot@CommonStates');
  assert.ok(state,type);
  for(const [name,role]of Object.entries(expected))assert.equal(state.styles['Background@'+name],role);
  assert.notEqual(state.styles['Background@Normal'],state.styles['Background@PointerOver']);
  assert.notEqual(state.styles['Background@Normal'],state.styles['Background@Pressed']);
 }
 const sub=host.menuTargets.find(x=>x.target==='MenuFlyoutSubItem > Grid#LayoutRoot@CommonStates');
 assert.equal(sub.styles['Background@SubMenuOpened'],sub.styles['Background@PointerOver']);
 const frame=host.menuTargets.find(x=>x.target==='MenuFlyoutPresenter > Border');
 assert.equal(frame.styles.BorderBrush,'color.border.overlay');
 assert.equal(frame.styles.BorderThickness,'border.width.default');
 assert.ok(!Object.keys(host.menuTargets.find(x=>x.target==='MenuFlyoutPresenter').styles).some(x=>x.startsWith('Border')),'one template-owned frame');
 const allowed=/^(?:Background(?:@(?:Normal|PointerOver|Pressed|Disabled|SubMenuOpened))?|Foreground|BorderBrush|BorderThickness|CornerRadius|Fill)$/;
 for(const rule of host.menuTargets.filter(x=>/^(?:MenuFlyout|ToggleMenuFlyout)/.test(x.target))){
  assert.match(rule.target,/^(?:MenuFlyout|ToggleMenuFlyout)/,'menu-class scope');
  assert.doesNotMatch(rule.target,/\[|Text=|Content=|Command=/,'command-independent matching');
  for(const property of Object.keys(rule.styles))assert.match(property,allowed,'native behavior, geometry and focus are preserved');
 }
});


test('taskbar app jump lists theme the shared shell container without command or app matching',async()=>{
 const host=await readJson('ports/windows/host.json');
 const mapping=await readJson('ports/windows/mapping.json');
 const styler=host.stylers.find(x=>x.id==='windows-11-notification-center-styler');
 const payload=await readJson('ports/windows/dist/'+styler.id+'.json');
 const wanted={
  'Border#JumpListRestyledAcrylic':{Background:'color.surface.raised',BorderBrush:'color.border.overlay',BorderThickness:'border.width.default',CornerRadius:'radius.none'},
  'Border#JumpListAcrylic':{Background:'color.surface.raised',CornerRadius:'radius.none'},
  'Grid#JumpListGrid':{Background:'color.surface.raised',CornerRadius:'radius.none'},
  'Grid#SystemItemsContainer > Border':{Background:'color.surface.raised',CornerRadius:'radius.none'},
  'Grid#SystemItemsContainer > Rectangle':{Fill:'color.border.divider'},
  'JumpViewUI.JumpListCategoryHeaderControl > Grid > TextBlock#HeadingTextBlock':{Foreground:'color.text.muted'},
 };
 for(const [target,styles]of Object.entries(wanted)){
  assert.deepEqual(styler.targets.find(x=>x.target===target)?.styles,styles,target);
  assert.equal(payload.controlStyles.filter(x=>x.target===target).length,1,target);
 }
 for(const type of ['JumpViewUI.SystemItemListViewItem','JumpViewUI.JumpListListViewItem']){
  const control=styler.targets.find(x=>x.target===type);
  assert.equal(control.styles.CornerRadius,'radius.none');
  assert.equal(control.styles.FocusVisualPrimaryBrush,'color.interaction.focus.ring');
  assert.equal(control.styles.FocusVisualSecondaryBrush,'color.interaction.focus.ring-container');
  const states=styler.targets.find(x=>x.target===type+' > Grid#LayoutRoot@CommonStates > Border#BackgroundBorder');
  assert.equal(states.styles['Background@Normal'],'color.surface.raised');
  assert.equal(states.styles['Background@PointerOver'],'color.interaction.hover.bg-strong');
  assert.equal(states.styles['Background@Pressed'],'color.interaction.pressed.bg');
  assert.equal(states.styles['Background@Selected'],'color.interaction.selection.bg');
  assert.notEqual(states.styles['Background@PointerOver'],states.styles['Background@Normal']);
 }
 const rules=styler.targets.filter(x=>/JumpViewUI|JumpList|SystemItemsContainer/.test(x.target));
 for(const rule of rules){
  assert.doesNotMatch(rule.target,/\[|Text=|Content=|Command=/);
  for(const [property,role]of Object.entries(rule.styles)){
   assert.ok(mapping.mappings[role].includes(styler.id+' | '+rule.target+' | '+property));
   assert.doesNotMatch(property,/Width|Height|Margin|Padding|Visibility|IsHitTestVisible|IsEnabled/);
  }
 }
});
