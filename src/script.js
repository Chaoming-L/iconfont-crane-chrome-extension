/*!
 * @author dawangraoming
 * @date 2018/06/25
 */
"use strict";

(function () {
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


    function download() {
        // 获取所有购物车内的元素
        const iconList = document.querySelectorAll(".block-car-container .block-icon-list>li");
        if (!iconList || iconList.length < 1) return;
        // 创建zip数据
        let zipFile = new JSZip();

        Array.from(iconList).forEach((liEle, index) => {
            const svg = liEle.querySelector('svg.icon');
            const name = liEle.querySelector('span.icon-name').innerText + ' ' + index + '.svg';
            const text = `<svg xmlns="${svg.getAttribute('xmlns')}" viewBox="${svg.getAttribute('viewBox')}" version="${svg.getAttribute('version')}">${svg.innerHTML}</svg>`;
            zipFile.file(name, text);
        });
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
        console.log('监听', request);
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