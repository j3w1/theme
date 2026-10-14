import { defaultTokens } from "./helpers/tokens.mjs";
import assert from 'node:assert/strict';
import test from 'node:test';
import {readJson} from '../scripts/lib/fs.mjs';
import {stylerSettings} from '../ports/windows/src/compatibility.mjs';

test('text-command and suggestion backings are shared once in every shell host and layout',async()=>{
 const host=await readJson('ports/windows/host.json');
 const mapping=await readJson('ports/windows/mapping.json');
 const variants=(await readJson('ports/windows/dist/windows-settings.json')).stylerVariants;
 const tokens=await defaultTokens();
 const frameKeys=['CommandBarFlyoutBackground','CommandBarFlyoutBorderBrush','CommandBarOverflowPresenterBackground',
  'FlyoutPresenterBackground','FlyoutPresenterBorderBrush','AutoSuggestBoxSuggestionsListBackground','AutoSuggestBoxSuggestionsListBorderBrush'];
 const targets=['Microsoft.UI.Xaml.Controls.Primitives.CommandBarFlyoutCommandBar',
  'CommandBarOverflowPresenter#SecondaryItemsControl','CommandBarOverflowPresenter#SecondaryItemsControl > Grid#LayoutRoot',
  'Grid#OverflowContentRoot','FlyoutPresenter','FlyoutPresenter > Border','Border#SuggestionsContainer','Grid#SuggestionsContainer','ListView#SuggestionsList'];
 for(const styler of host.stylers){
  const payload=await readJson('ports/windows/dist/'+styler.id+'.json');
  for(const key of frameKeys){
   const values=payload.themeResourceVariables.filter(x=>x.startsWith(key+'='));
   assert.deepEqual(values,[key+'='+tokens[host.resources[key]].css],styler.id+'.'+key);
   assert.ok(mapping.mappings[host.resources[key]].includes('windhawk.resource.'+key));
  }
  for(const selected of [payload,...Object.keys(variants[styler.id]??{}).map(layout=>stylerSettings(payload,variants[styler.id],layout))]){
   for(const target of targets){
    const rules=selected.controlStyles.filter(x=>x.target===target);
    assert.equal(rules.length,1,styler.id+' '+target);
    assert.ok(rules[0].styles.includes('Background='+tokens['color.surface.raised'].css));
   }
  }
  assert.ok(!styler.targets.some(x=>targets.includes(x.target)),'no local override masks shared popup '+styler.id);
 }
 for(const rule of host.menuTargets.slice(9)){
  assert.doesNotMatch(rule.target,/Text=|Content=|Command=/,'matching is independent of command labels');
  assert.ok(Object.keys(rule.styles).every(key=>['Background','Foreground','BorderBrush','BorderThickness','CornerRadius','Fill'].includes(key)),
   'no width, offsets, command, focus or accessibility behavior override');
  for(const [property,role]of Object.entries(rule.styles))assert.ok(mapping.mappings[role].includes('windhawk.menu | '+rule.target+' | '+property));
 }
});

test('text commands have complete rest, hover, pressed, disabled and checked resource states',async()=>{
 const {resources}=await readJson('ports/windows/host.json');
 const prefix='CommandBarFlyoutAppBarButton';
 const expected={
  '':'color.surface.raised',PointerOver:'color.interaction.hover.bg-strong',Pressed:'color.interaction.pressed.bg',Disabled:'color.surface.raised',
  Checked:'color.interaction.selection.bg',CheckedPointerOver:'color.interaction.selection.bg',CheckedPressed:'color.interaction.pressed.bg',CheckedDisabled:'color.interaction.disabled.bg',
 };
 for(const [state,role]of Object.entries(expected)){
  assert.equal(resources[prefix+'Background'+state],role,state);
  const text=state.includes('Disabled')?'color.text.disabled':state==='Checked'||state==='CheckedPointerOver'?'color.interaction.selection.text':'color.text.default';
  assert.equal(resources[prefix+'Foreground'+state],text,state);
 }
 assert.notEqual(resources[prefix+'Background'],resources[prefix+'BackgroundPointerOver'],'pointer exit returns to distinct rest color');
 for(const suffix of ['','PointerOver','Pressed'])assert.equal(resources[prefix+'KeyboardTextLabelForeground'+suffix],'color.text.muted');
 assert.equal(resources[prefix+'SubItemChevronDisabledForeground'],'color.text.disabled');
});

test('Settings suggestion rows retain selection while hovered and use complete native state properties',async()=>{
 const host=await readJson('ports/windows/host.json');
 const settings=host.stylers.find(x=>x.id==='windows-11-settings-styler');
 const presenter=settings.targets.find(x=>x.target==='Windows.UI.Xaml.Controls.Primitives.ListViewItemPresenter');
 assert.ok(presenter,'native primitives namespace is required');
 assert.equal(presenter.styles.Background,'color.surface.raised');
 assert.equal(presenter.styles.PointerOverBackground,'color.interaction.hover.bg-strong');
 assert.equal(presenter.styles.SelectedBackground,'color.interaction.selection.bg');
 assert.equal(presenter.styles.SelectedPointerOverBackground,presenter.styles.SelectedBackground);
 assert.equal(presenter.styles.SelectedPressedBackground,presenter.styles.SelectedBackground);
 assert.equal(presenter.styles.SelectedDisabledBackground,'color.interaction.disabled.bg');
 assert.equal(presenter.styles.SelectedForeground,'color.interaction.selection.text');
 for(const suffix of ['','PointerOver','Pressed','Selected','SelectedPointerOver','SelectedPressed','Disabled','SelectedDisabled']){
  assert.ok(settings.resources['ListViewItemBackground'+suffix],suffix+' resource');
  assert.ok(settings.resources['ListViewItemForeground'+suffix],suffix+' text');
 }
 assert.ok(!Object.keys(presenter.styles).some(x=>/Focus|Opacity|Width|Margin|Padding|Visibility|Template/.test(x)));
 const explorer=host.stylers.find(x=>x.id==='windows-11-file-explorer-styler');
 assert.equal(explorer.targets.find(x=>x.target==='CommandBar#FileExplorerCommandBar').styles.Background,'color.surface.canvas','Explorer toolbar keeps its black background');
});

test('detached Settings search backings replace acrylic without changing content or popup layout',async()=>{
 const host=await readJson('ports/windows/host.json');
 const settings=host.stylers.find(x=>x.id==='windows-11-settings-styler');
 const mapping=await readJson('ports/windows/mapping.json');
 const tokens=await defaultTokens();
 const payload=await readJson('ports/windows/dist/'+settings.id+'.json');
 const backing=target=>[...host.menuTargets,...settings.targets].find(x=>x.target===target);
 // The status popup owns a Border; the suggestions popup owns a Grid. Its
 // transparent feedback footer must inherit the same opaque raised surface.
 for(const target of ['Border#StatusTextPopupBorder','Grid#SuggestionsContainer']){
  const rule=backing(target);assert.ok(rule,target);
  assert.equal(rule.styles.Background,'color.surface.raised');
  assert.equal(rule.styles.BorderBrush,'color.border.overlay');
  assert.equal(rule.styles.BorderThickness,'border.width.default');
  assert.equal(rule.styles.CornerRadius,'radius.none');
  assert.deepEqual(payload.controlStyles.filter(x=>x.target===target).map(x=>x.styles),[
   ['Background='+tokens['color.surface.raised'].css,'BorderBrush='+tokens['color.border.overlay'].css,'BorderThickness=1','CornerRadius=0'],
  ]);
 }
 assert.ok(!settings.targets.some(x=>/SearchFeedback/.test(x.target)),'footer inherits container paint without another opaque layer');
 assert.ok(!host.menuTargets.some(x=>/StatusTextPopupBorder|CommandSearchTextBox/.test(x.target)),'Settings template details do not leak to other hosts');
 const searchRules=settings.targets.filter(x=>/StatusTextPopupBorder|CommandSearchTextBox/.test(x.target));
 assert.equal(searchRules.length,4);
 for(const rule of searchRules){
  assert.doesNotMatch(rule.target,/Text=|Content=|Command=/,'matching uses template identity, never user data');
  for(const [property,role]of Object.entries(rule.styles)){
   assert.match(property,/^(?:Background|Foreground|BorderBrush|BorderThickness|CornerRadius)(?:@(?:Normal|PointerOver|Focused|Disabled))?$/);
   assert.ok(mapping.mappings[role].includes(settings.id+' | '+rule.target+' | '+property));
  }
 }
});

test('Settings search input and placeholder follow the observed native CommonStates',async()=>{
 const settings=(await readJson('ports/windows/host.json')).stylers.find(x=>x.id==='windows-11-settings-styler');
 const textbox=settings.targets.find(x=>x.target==='TextBox#CommandSearchTextBox');
 assert.equal(textbox.styles.Background,'color.surface.input','local translucent white base is replaced');
 assert.equal(textbox.styles.Foreground,'color.text.default');
 const frame=settings.targets.find(x=>x.target==='TextBox#CommandSearchTextBox > Grid@CommonStates > Border#BorderElement');
 const placeholder=settings.targets.find(x=>x.target==='TextBox#CommandSearchTextBox > Grid@CommonStates > TextBlock#PlaceholderTextContentPresenter');
 assert.ok(frame&&placeholder,'state group belongs to the direct Grid, not the Border');
 for(const [state,bg,edge,text]of [
  ['Normal','color.surface.input','color.border.control','color.text.placeholder'],
  ['PointerOver','color.interaction.hover.bg','color.border.control','color.text.placeholder'],
  ['Focused','color.surface.input','color.border.active','color.text.placeholder'],
  ['Disabled','color.interaction.disabled.bg','color.border.disabled','color.text.disabled'],
 ]){
  assert.equal(frame.styles['Background@'+state],bg,state);
  assert.equal(frame.styles['BorderBrush@'+state],edge,state);
  assert.equal(placeholder.styles['Foreground@'+state],text,state);
 }
 assert.notEqual(frame.styles['Background@Normal'],frame.styles['Background@PointerOver'],'exit restores the input surface');
 assert.notEqual(frame.styles['BorderBrush@Normal'],frame.styles['BorderBrush@Focused'],'focus stays distinct');
});

test('Settings search removes clipping on its exact native parent without another frame',async()=>{
 const host=await readJson('ports/windows/host.json');
 const settings=host.stylers.find(x=>x.id==='windows-11-settings-styler');
 const target='SystemSettings.View.SettingsCommandSearchBox > StackPanel#SettingsCommandSearchBoxBackground';
 const parent=settings.targets.filter(x=>x.target===target);
 assert.equal(parent.length,1,'the wrapper with native rounded child clipping is mapped once');
 assert.deepEqual(parent[0].styles,{CornerRadius:'radius.none'},'only parent clipping changes; no extra border, fill or layout override');
 assert.ok(!host.stylers.filter(x=>x!==settings).some(x=>x.targets.some(t=>t.target===target)),'this Settings template is not applied in other hosts');
 const mapping=await readJson('ports/windows/mapping.json');
 assert.ok(mapping.mappings['radius.none'].includes(settings.id+' | '+target+' | CornerRadius'));
 const button=settings.targets.find(x=>x.target==='Button > ContentPresenter@CommonStates');
 assert.ok(button,'the common button state mapping remains present');
 for(const state of ['Normal','PointerOver','Pressed','Disabled'])assert.ok(button.styles['Background@'+state],state);
 const inputFrame=settings.targets.find(x=>x.target==='TextBox#CommandSearchTextBox > Grid@CommonStates > Border#BorderElement');
 assert.equal(inputFrame.styles['BorderBrush@Focused'],'color.border.active','the native input retains its focused edge');
});
