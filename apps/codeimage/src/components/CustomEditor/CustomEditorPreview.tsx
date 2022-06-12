import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {EditorView} from '@codemirror/view';
import {createCodeMirror} from 'solid-codemirror';
import {
  batch,
  createEffect,
  createMemo,
  createResource,
  onCleanup,
  onMount,
  VoidProps,
} from 'solid-js';
import {SUPPORTED_FONTS} from '../../core/configuration/font';
import {createCustomFontExtension} from './custom-font-extension';
import {fixCodeMirrorAriaRole} from './fix-cm-aria-roles-lighthouse';

interface CustomEditorPreviewProps {
  themeId: string;
  languageId: string;
  code: string;
}

// TODO: create a `runMode` plugin like cm5

export default function CustomEditorPreview(
  props: VoidProps<CustomEditorPreviewProps>,
) {
  let editorEl!: HTMLDivElement;
  fixCodeMirrorAriaRole(() => editorEl);
  const {themeArray: themes} = getThemeStore();
  const languages = SUPPORTED_LANGUAGES;
  const fonts = SUPPORTED_FONTS;
  const {options: editorOptions} = getRootEditorStore();

  const selectedLanguage = createMemo(() =>
    languages.find(language => language.id === props.languageId),
  );

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const themeConfiguration = createMemo(
    () =>
      themes().find(theme => theme()?.id === props.themeId)?.() ??
      themes()[0]?.(),
  );

  const currentTheme = () => themeConfiguration()?.editorTheme || [];

  const supportsLineWrap = EditorView.lineWrapping;

  const baseTheme = EditorView.theme({
    '&': {
      textAlign: 'left',
      fontSize: '11px',
      background: 'transparent',
      userSelect: 'none',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
    },
    '.cm-line': {
      padding: '0 2px 0 8px',
    },
  });

  const customFontExtension = () =>
    createCustomFontExtension({
      fontName:
        fonts.find(({id}) => editorOptions.fontId === id)?.name ||
        fonts[0].name,
      fontWeight: editorOptions.fontWeight,
    });

  const {view, setOptions, setContainer} = createCodeMirror({
    container: editorEl,
    editable: false,
    extensions: [],
    'aria-readonly': 'true',
  });

  onMount(() => setContainer(editorEl));

  createEffect(() =>
    batch(() => {
      setOptions({
        value: props.code,
        extensions: [
          customFontExtension(),
          baseTheme,
          supportsLineWrap,
          currentTheme(),
          currentLanguage() || [],
        ],
      });
    }),
  );

  onCleanup(() => view()?.destroy());

  return <div ref={ref => (editorEl = ref)} />;
}
