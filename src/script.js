/*!
 * @author dawangraoming
 * @date 2018/06/25
 */
"use strict";

(function () {
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);

    let timeHandler;
    // 添加遮罩层，防止认为页面卡死
    const mask = document.createElement('div');
    const maskId = mask.id = '__dawangraoming_mask__';
    mask.style.cssText = `
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 9999;
    background: rgba(0,0,0,0.5);
    left: 0;
    top: 0;
    color: #FFF;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    display:none;
    `;
    mask.innerText = '操作中，请稍后。。。';

    /**
     * 将SVG转PNG数据
     * @param svg {string} svg 字符串
     * @param [type] {string} 下载类型，支持png、GIF、
     * @return {Promise<string>} 返回一个Promise
     */
    function createPNG(svg, type) {
        return new Promise(resolve => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            canvas.style.cssText = `
             position: absolute;
             left:0;
             top:0;
             display:block;
            `
            document.body.appendChild(img);
            document.body.appendChild(canvas);
            const sizeInput = $('.manage-mid-wrap .size-input');
            const size = sizeInput ? sizeInput.value : 200;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            // 设置高质量，防止缩放时导致不清晰
            ctx.imageSmoothingQuality = 'high';
            // 设置输出类型
            let compileType;
            switch (type) {
                case 'webp':
                    compileType = 'webp';
                    break;

                case 'jpg':
                case 'jpeg':
                    compileType = 'jpep';
                    break;

                case 'png':
                default:
                    compileType = 'png'
            }
            compileType = 'image/' + compileType;
            // 图片加载完毕后
            img.onload = function () {
                ctx.drawImage(img, 0, 0, size, size);
                resolve(canvas.toDataURL(compileType));
                canvas.remove();
                img.remove();
            };
            img.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        });
    }

    /**
     * 下载模块
     * @param [type] {string} 可选，下载类型，支持png、svg，默认svg
     */
    async function download(type) {
        // 获取所有购物车内的元素
        const iconList = document.querySelectorAll(".block-car-container .block-icon-list>li");
        if (!iconList || iconList.length < 1) return;
        // 创建zip数据
        let zipFile = new JSZip();

        for (let index = 0; index < iconList.length; index++) {
            const liEle = iconList[index];
            // 获取SVG DOM
            const svg = liEle.querySelector('svg.icon');
            // 获取图标的名词
            let name = liEle.querySelector('span.icon-name').innerText + ' ' + index;
            // 获取SVG路径，去除掉无用的信息
            const text = `<svg xmlns="${svg.getAttribute('xmlns')}" viewBox="${svg.getAttribute('viewBox')}" version="${svg.getAttribute('version')}">${svg.innerHTML}</svg>`;
            if (type === 'svg' || !type) {
                name += '.svg';
                zipFile.file(name, text);
            } else {
                name += '.' + type;
                let pngFile = await createPNG(text, type);
                pngFile = pngFile.replace(/^data:image\/\w+;base64,/, '');
                zipFile.file(name, pngFile, {base64: true});
            }
        }
        zipFile.generateAsync({type: "blob"}).then(function (content) {
            const url = window.URL.createObjectURL(new Blob([content], {"type": "application\/zip"}));
            // 创建一个下载标签
            const a = document.createElement("a");
            document.body.appendChild(a);
            a.setAttribute("class", "svg-crowbar");
            a.setAttribute("download", "大王饶命.zip");
            a.setAttribute("href", url);
            a.style["display"] = "none";
            a.click();

            setTimeout(function () {
                window.URL.revokeObjectURL(url);
            }, 10);
        });
    }


    function select(type) {
        mask.style.display = 'flex';
        clearTimeout(timeHandler);
        // 高频操作前做一个延迟，防止遮罩层未渲染
        timeHandler = window.setTimeout(function () {
            const iconList = document.querySelectorAll("#magix_vf_main .block-icon-list>li");
            Array.from(iconList).forEach(ele => {
                // 如果是全选，则排除掉已经选中的元素
                if (type === 'all') {
                    if (/selected/.test(ele.className)) return;
                }
                ele.querySelector('.icon-gouwuche1').click();
            });
            mask.style.display = 'none';
        }, 300);
    }

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.type) {
            case 'select-all':
                select('all');
                break;

            case 'select-invert':
                select('invert');
                break;

            case 'download-svg':
                download('svg');
                break;

            case 'download-png':
                download('png');
                break;

            case 'download-jpg':
                download('jpg');
                break;

            case 'download-webp':
                download('webp');
                break;
        }
        sendResponse('over');
    });

    document.body.appendChild(mask);
    // 监听DOM，每次变动后都判断插入的元素是否存在，不存在则重新插入
    document.addEventListener('DOMSubtreeModified', function () {
        if (!document.querySelector('#' + maskId)) {
            document.body.appendChild(mask);
        }
    });
})();