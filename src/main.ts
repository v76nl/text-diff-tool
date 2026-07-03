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
        return;
    }

    let diffResults: Diff.Change[] = [];

    // jsdiffライブラリを使用して差分を計算
    if (mode === 'chars') {
        diffResults = Diff.diffChars(text1, text2);
    } else if (mode === 'words') {
        diffResults = Diff.diffWords(text1, text2);
    } else if (mode === 'lines') {
        diffResults = Diff.diffLines(text1, text2);
    }

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
        originalText.value = "吾輩は猫である。名前はまだ無い。\nどこで生れたかとんと見当がつかぬ。\n何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。";
        modifiedText.value = "吾輩は犬である。名前はポチという。\nどこで生れたかとんと見当がつかぬ。\n何でも明るいぽかぽかした所でワンワン吠えていた事だけは記憶している。";
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
        // テキストのみを抽出(<ins><del>などのタグを除外した、純粋な表示テキストをコピーしたい場合はinnerTextを使用)
        // 単純に結果テキストをコピーするよりは、変更後のテキストをベースにコピーするか、そのままプレーンテキスト化してコピーする
        const textToCopy = diffOutput.innerText;

        if (!textToCopy || textToCopy === 'ここに比較結果が表示されます') {
            return;
        }

        // テキストをクリップボードにコピー
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
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
