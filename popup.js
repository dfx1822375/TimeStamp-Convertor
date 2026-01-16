document.addEventListener('DOMContentLoaded', () => {
    const inputData = document.getElementById('input-data');
    const btnConvert = document.getElementById('btn-convert');
    const btnNow = document.getElementById('btn-now');
    const timezoneSelect = document.getElementById('timezone-select');
    const resultContainer = document.getElementById('result-container');
    const outputResult = document.getElementById('output-result');
    const tsSeconds = document.getElementById('ts-seconds');
    const tsMillis = document.getElementById('ts-millis');
    const utcTime = document.getElementById('utc-time');
    const radioButtons = document.querySelectorAll('input[name="ts-unit"]');

    // 初始化设置当前时间
    setNow();

    btnConvert.addEventListener('click', convert);
    btnNow.addEventListener('click', setNow);
    timezoneSelect.addEventListener('change', convert);

    // 监听单选框变化，立即触发转换
    radioButtons.forEach(radio => {
        radio.addEventListener('change', convert);
    });

    inputData.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            convert();
        }
    });

    inputData.addEventListener('input', () => {
        // 当用户手动输入时，可以尝试实时转换，或者保持按需转换，这里保持按需但清理错误状态
    });

    // 复制功能
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl && targetEl.textContent) {
                navigator.clipboard.writeText(targetEl.textContent).then(() => {
                    const originalText = btn.textContent;
                    btn.textContent = '✅';
                    setTimeout(() => {
                        btn.textContent = originalText;
                    }, 1500);
                });
            }
        });
    });

    function setNow() {
        const now = new Date();
        // 默认设置为毫秒级时间戳 (用户请求优化)
        inputData.value = now.getTime();

        // 设置单选框为 'millis'
        const millisRadio = document.querySelector('input[value="millis"]');
        if (millisRadio) millisRadio.checked = true;

        convert();
    }

    function getSelectedUnit() {
        const selected = document.querySelector('input[name="ts-unit"]:checked');
        return selected ? selected.value : 'auto';
    }

    function convert() {
        // 添加简单的按钮点击反馈
        btnConvert.classList.add('btn-animate');
        setTimeout(() => {
            btnConvert.classList.remove('btn-animate');
        }, 200);

        const val = inputData.value.trim();
        if (!val) {
            hideResult();
            return;
        }

        let date;

        // 允许负数和浮点数 (虽然通常时间戳是整数，但宽松一点更好)
        // 使用 isFinite 判断是否为有效数字
        const isNum = !isNaN(val) && !isNaN(parseFloat(val));

        if (isNum) {
            // 是数字，当作时间戳处理
            let timestamp = parseFloat(val);
            const unit = getSelectedUnit();

            if (unit === 'seconds') {
                timestamp *= 1000;
            } else if (unit === 'millis') {
                // 已经是毫秒，不需要处理
            } else {
                // auto 自动判断
                // 经验判断：如果小于 10000000000 (100亿)，大概率是秒 (100亿秒是 2286年)
                // 毫秒通常是 13 位及以上
                if (Math.abs(timestamp) < 10000000000) {
                    timestamp *= 1000;
                }
            }

            date = new Date(timestamp);
        } else {
            // 尝试解析日期字符串
            date = new Date(val);
        }

        if (isNaN(date.getTime())) {
            // 只有在真的无法解析时才报错
            // 为了不打扰用户，可以在界面显示错误而不是 alert
            outputResult.textContent = "无法识别的时间格式";
            tsSeconds.textContent = "-";
            tsMillis.textContent = "-";
            utcTime.textContent = "-";
            resultContainer.style.display = 'flex';
            return;
        }

        showResult(date);
    }

    function showResult(date) {
        const timezone = timezoneSelect.value;

        // 触发结果区域的更新动画
        resultContainer.classList.remove('result-updated');
        // 强制重绘
        void resultContainer.offsetWidth;
        resultContainer.classList.add('result-updated');

        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };

        if (timezone !== 'local') {
            options.timeZone = timezone;
        }

        try {
            // 使用 toLocaleString 并处理格式
            // 为了确保不同浏览器下格式一致，最好使用 formatToParts，但这里为了保持代码简单，使用标准 zh-CN 格式
            // zh-CN 在 Chrome 下通常是 "yyyy/mm/dd hh:mm:ss" 或 "yyyy-mm-dd..."
            // 我们强制把斜杠替换为短横线
            let formattedString = date.toLocaleString('zh-CN', options).replace(/\//g, '-');

            outputResult.textContent = formattedString;

            // 详细信息
            tsSeconds.textContent = Math.floor(date.getTime() / 1000);
            tsMillis.textContent = date.getTime();
            utcTime.textContent = date.toISOString().replace('T', ' ').replace('z', '').replace(/\.\d{3}Z/, ' UTC');

            resultContainer.style.display = 'flex';
        } catch (e) {
            console.error("Format error", e);
            outputResult.textContent = "格式化错误: " + e.message;
            resultContainer.style.display = 'flex';
        }
    }

    function hideResult() {
        resultContainer.style.display = 'none';
    }
});
