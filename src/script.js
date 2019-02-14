/*!
 * @author Damon
 * @date 2019/01/29
 */
"use strict";

(function () {
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);

    /**
     * 将SVG转PNG数据
     * @param svg {string} svg 字符串
     * @param [size] {number} 图像尺寸、
     * @param [type] {string} 下载类型，支持png、GIF、
     * @return {Promise<string>} 返回一个Promise
     */
    function createPNG(svg, size, type) {
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
            size = size ? size : 200;
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
                resolve(canvas.toDataURL(compileType), 1);
                canvas.remove();
                img.remove();
            };
            img.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        });
    }

    /**
     * 下载模块
     * @param [type] {string} 可选，下载类型，支持png、svg，默认svg
     * @param [size] {number} 图像尺寸
     */
    async function download(type = 'svg', size = 200) {
        // 获取所有购物车内的元素
        const iconList = document.querySelectorAll(".project-iconlist .block-icon-list>li");

        if (!iconList || iconList.length < 1) return;
        // 创建zip数据
        let zipFile = new JSZip();

        for (let index = 0; index < iconList.length; index++) {
            const liEle = iconList[index];
            // 获取SVG DOM
            const svg = liEle.querySelector('svg.icon');
            // 获取图标的名词
            let name = liEle.querySelector('span.icon-code-show').innerText;
            // 获取SVG路径，去除掉无用的信息
          const text = `<svg xmlns="${svg.getAttribute('xmlns')}" width="${size}" height="${size}" viewBox="${svg.getAttribute('viewBox')}"  version="${svg.getAttribute('version')}">${svg.innerHTML}</svg>`;
            if (type === 'svg') {
                name += '.svg';
                zipFile.file(name, text);
            } else {
                name += '.' + type;
                let pngFile = await createPNG(text, size, type);
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
            a.setAttribute("download", `${type}s.zip`);
            a.setAttribute("href", url);
            a.style["display"] = "none";
            a.click();

            setTimeout(function () {
                window.URL.revokeObjectURL(url);
            }, 10);
        });
    }

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.type) {
            case 'download-svg':
                download('svg', request.size);
                break;

            case 'download-png':
                download('png', request.size);
                break;

            case 'download-jpg':
                download('jpg', request.size);
                break;

            case 'download-webp':
                download('webp', request.size);
                break;
        }
        sendResponse('over');
    });
})();