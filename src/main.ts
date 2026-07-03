import * as Diff from 'diff';
import './style.css';

// DOM要素の取得
const originalText = document.getElementById('originalText') as HTMLTextAreaElement;
const modifiedText = document.getElementById('modifiedText') as HTMLTextAreaElement;
const diffOutput = document.getElementById('diffOutput') as HTMLDivElement;
const diffMode = document.getElementById('diffMode') as HTMLSelectElement;

const swapBtn = document.getElementById('swapBtn') as HTMLButtonElement;
const swapBtnMobile = document.getElementById('swapBtnMobile') as HTMLButtonElement;
const clearOriginalBtn = document.getElementById('clearOriginalBtn') as HTMLButtonElement;
const clearModifiedBtn = document.getElementById('clearModifiedBtn') as HTMLButtonElement;
const sampleBtn = document.getElementById('sampleBtn') as HTMLButtonElement;
const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
const toast = document.getElementById('toast') as HTMLDivElement;
// 最新の差分結果を保持する変数（コピー機能で使用）
let lastDiffResults: { value: string; added?: boolean; removed?: boolean }[] = [];

// マークダウン用に差分テキストを整形（追加部分を**、削除部分を~~で囲む。改行や空白は考慮する）
function formatMarkdownPart(value: string, tag: string): string {
    return value.split('\n').map(line => {
        if (!line) {
            return line;
        }
        const match = line.match(/^(\s*)(.*?)(\s*)$/);
        if (match) {
            const [, leading, content, trailing] = match;
            if (content) {
                return `${leading}${tag}${content}${tag}${trailing}`;
            }
        }
        return line;
    }).join('\n');
}

// 比較処理メイン関数
function updateDiff(): void {
    if (!originalText || !modifiedText || !diffOutput || !diffMode) {
        return;
    }

    const text1 = originalText.value;
    const text2 = modifiedText.value;
    const mode = diffMode.value;

    // 両方が空の場合はリセット
    if (!text1 && !text2) {
        diffOutput.innerHTML = '<span class="diff-placeholder">ここに比較結果が表示されます</span>';
        lastDiffResults = [];
        return;
    }

    let diffResults: { value: string; added?: boolean; removed?: boolean }[] = [];

    // jsdiffライブラリを使用して差分を計算
    if (mode === 'chars') {
        diffResults = Diff.diffChars(text1, text2);
    } else if (mode === 'words') {
        if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
            const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'word' });
            const tokenize = (text: string) => Array.from(segmenter.segment(text), (s: any) => s.segment as string);
            const tokens1 = tokenize(text1);
            const tokens2 = tokenize(text2);
            diffResults = Diff.diffArrays(tokens1, tokens2).map(part => ({
                value: part.value.join(''),
                added: part.added,
                removed: part.removed
            }));
        } else {
            diffResults = Diff.diffWords(text1, text2);
        }
    } else if (mode === 'lines') {
        diffResults = Diff.diffLines(text1, text2);
    }

    lastDiffResults = diffResults;

    // DocumentFragmentを使ってパフォーマンス向上
    const fragment = document.createDocumentFragment();

    diffResults.forEach((part) => {
        const span = document.createElement('span');
        // 改行や空白をそのまま表示するために textContent を使用
        span.textContent = part.value;

        // 差分の種類に応じてクラスを付与
        if (part.added) {
            span.className = 'diff-added';
        } else if (part.removed) {
            span.className = 'diff-removed';
        } else {
            span.className = 'diff-normal';
        }

        fragment.appendChild(span);
    });

    // 結果を出力エリアに反映
    diffOutput.innerHTML = '';
    diffOutput.appendChild(fragment);
}

// イベントリスナーの設定
if (originalText && modifiedText && diffMode) {
    // inputイベントでリアルタイム更新
    originalText.addEventListener('input', updateDiff);
    modifiedText.addEventListener('input', updateDiff);
    diffMode.addEventListener('change', updateDiff);
}

// テキスト入れ替え機能
function swapTexts(): void {
    if (originalText && modifiedText) {
        const temp = originalText.value;
        originalText.value = modifiedText.value;
        modifiedText.value = temp;
        updateDiff();
    }
}

if (swapBtn) {
    swapBtn.addEventListener('click', swapTexts);
}
if (swapBtnMobile) {
    swapBtnMobile.addEventListener('click', swapTexts);
}

// クリア機能
if (clearOriginalBtn && originalText) {
    clearOriginalBtn.addEventListener('click', () => {
        originalText.value = '';
        updateDiff();
        originalText.focus();
    });
}
if (clearModifiedBtn && modifiedText) {
    clearModifiedBtn.addEventListener('click', () => {
        modifiedText.value = '';
        updateDiff();
        modifiedText.focus();
    });
}

// サンプルテキスト入力機能
if (sampleBtn && originalText && modifiedText) {
    sampleBtn.addEventListener('click', () => {
        originalText.value = "吾輩は猫である。名前はまだ無い。\nどこで生れたかとんと見当がつかぬ。\n何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。\n\nThe quick brown fox jumps over the lazy dog.";
        modifiedText.value = "吾輩は犬である。名前はポチという。\nどこで生れたかとんと見当がつかぬ。\n何でも明るいぽかぽかした所でワンワン吠えていた事だけは記憶している。\n\nThe fast brown fox jumps over a lazy dog.";
        updateDiff();
    });
}

// トースト通知を表示する関数
function showToast(message: string): void {
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');

        // 3秒後に非表示
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// クリップボードへのコピー機能
if (copyBtn && diffOutput) {
    copyBtn.addEventListener('click', () => {
        if (lastDiffResults.length === 0) {
            return;
        }

        let markdownText = '';
        const noSpaceBeforeRegex = /[\s.,;:!?。、！？（｛［「『]$/;
        const noSpaceAfterRegex = /^[\s.,;:!?。、！？）｝］）」』]/;

        lastDiffResults.forEach((part, index) => {
            if (part.added || part.removed) {
                const tag = part.added ? '**' : '~~';
                const formattedContent = formatMarkdownPart(part.value, tag);

                // 前にスペース、改行、または特定の開始記号（括弧など）がない場合はスペースを入れる
                const needsSpaceBefore = markdownText.length > 0 && !noSpaceBeforeRegex.test(markdownText);
                
                // 次にスペース、改行、または特定の終了記号・句読点がない場合はスペースを入れる
                const nextPart = index < lastDiffResults.length - 1 ? lastDiffResults[index + 1] : null;
                const needsSpaceAfter = nextPart && !noSpaceAfterRegex.test(nextPart.value);

                markdownText += (needsSpaceBefore ? ' ' : '') + formattedContent + (needsSpaceAfter ? ' ' : '');
            } else {
                markdownText += part.value;
            }
        });

        if (!markdownText) {
            return;
        }

        // テキストをクリップボードにコピー
        const textArea = document.createElement("textarea");
        textArea.value = markdownText;
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            showToast("結果をコピーしました！");
        } catch (err) {
            console.error('Copy failed', err);
            showToast("コピーに失敗しました");
        }

        document.body.removeChild(textArea);
    });
}

// 初期化時に一度実行(空の状態を描画)
updateDiff();
