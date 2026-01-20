document.addEventListener('DOMContentLoaded', () => {
    const inputData = document.getElementById('input-data');
    const inputLabel = document.querySelector('label[for="input-data"]');
    const unitSelector = document.getElementById('unit-selector');
    const outputUnitSelector = document.getElementById('output-unit-selector');

    const btnConvert = document.getElementById('btn-convert');
    const btnNow = document.getElementById('btn-now');
    const timezoneSelect = document.getElementById('timezone-select');

    const resultContainer = document.getElementById('result-container');
    const resultLabel = document.querySelector('.result-item .label');
    const outputResult = document.getElementById('output-result');
    const tsSeconds = document.getElementById('ts-seconds');
    const tsMillis = document.getElementById('ts-millis');
    const utcTime = document.getElementById('utc-time');

    const radioButtons = document.querySelectorAll('input[name="ts-unit"]');
    const outRadioButtons = document.querySelectorAll('input[name="out-unit"]');
    const tabButtons = document.querySelectorAll('.tab-btn');

    let currentMode = 'ts2date'; // 'ts2date' or 'date2ts'
    let savedInput = {
        ts2date: '',
        date2ts: ''
    };

    // 初始化
    init();

    function init() {
        // 绑定 Tab 点击事件
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => switchMode(btn.dataset.tab));
        });

        // 绑定功能事件
        btnConvert.addEventListener('click', convert);
        btnNow.addEventListener('click', setNow);
        timezoneSelect.addEventListener('change', convert);

        radioButtons.forEach(radio => radio.addEventListener('change', convert));
        outRadioButtons.forEach(radio => radio.addEventListener('change', convert));

        inputData.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') convert();
        });

        setupCopyButtons();

        // 默认设置当前时间
        setNow();
    }

    function switchMode(mode) {
        if (currentMode === mode) return;

        // 1. 保存当前模式的输入内容
        savedInput[currentMode] = inputData.value;

        // 切换模式
        currentMode = mode;

        // 更新 Tab 样式
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === mode);
        });

        // 更新 UI 文本和显隐
        if (currentMode === 'ts2date') {
            inputLabel.textContent = "输入 (时间戳)";
            inputData.placeholder = "例如: 1678888888";
            unitSelector.style.display = 'flex';
            outputUnitSelector.style.display = 'none';
            resultLabel.textContent = "转换时间:";
        } else {
            inputLabel.textContent = "输入 (日期/时间)";
            inputData.placeholder = "例如: 2023-01-01 12:00:00";
            unitSelector.style.display = 'none';
            outputUnitSelector.style.display = 'flex';
            resultLabel.textContent = "转换时间戳:";
        }

        // 2. 恢复或初始化新模式的输入内容
        if (savedInput[mode]) {
            inputData.value = savedInput[mode];
            convert(); // 立即转换恢复的内容
        } else {
            // 如果新模式没有历史记录，默认填入当前时间
            setNow();
        }
    }

    function setNow() {
        const now = new Date();

        if (currentMode === 'ts2date') {
            // ts2date 模式: 填入当前时间戳
            inputData.value = now.getTime();
            const millisRadio = document.querySelector('input[value="millis"]');
            if (millisRadio) millisRadio.checked = true;
        } else {
            // date2ts 模式: 填入当前日期字符串
            const pad = n => n.toString().padStart(2, '0');
            const str = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
                `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            inputData.value = str;
        }

        // 更新保存的状态
        savedInput[currentMode] = inputData.value;

        convert();
    }

    function getSelectedUnit() {
        const selected = document.querySelector('input[name="ts-unit"]:checked');
        return selected ? selected.value : 'auto';
    }

    function getOutputUnit() {
        const selected = document.querySelector('input[name="out-unit"]:checked');
        return selected ? selected.value : 'millis';
    }

    function convert() {
        btnConvert.classList.add('btn-animate');
        setTimeout(() => btnConvert.classList.remove('btn-animate'), 200);

        const val = inputData.value.trim();
        if (!val) {
            hideResult();
            return;
        }

        let date;

        if (currentMode === 'ts2date') {
            // ----- 时间戳 转 时间 -----
            // 逻辑与之前类似，但只接受数字或类数字
            const isNum = !isNaN(val) && !isNaN(parseFloat(val));
            if (isNum) {
                let timestamp = parseFloat(val);
                const unit = getSelectedUnit();

                if (unit === 'seconds') {
                    timestamp *= 1000;
                } else if (unit === 'millis') {
                    // pass
                } else {
                    // auto
                    if (Math.abs(timestamp) < 10000000000) {
                        timestamp *= 1000;
                    }
                }
                date = new Date(timestamp);
            } else {
                date = new Date(val);
            }

        } else {
            // ----- 时间 转 时间戳 -----
            date = new Date(val);
        }

        if (isNaN(date.getTime())) {
            showError("无法识别的时间格式");
            return;
        }

        showResult(date);
    }

    function showResult(date) {
        // UI 动画
        resultContainer.classList.remove('result-updated');
        void resultContainer.offsetWidth;
        resultContainer.classList.add('result-updated');

        const timezone = timezoneSelect.value;
        const options = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        };
        if (timezone !== 'local') options.timeZone = timezone;

        let formattedString = "Error";
        try {
            formattedString = date.toLocaleString('zh-CN', options).replace(/\//g, '-');
        } catch (e) {
            formattedString = "Format Error";
        }

        // 核心显示逻辑
        if (currentMode === 'ts2date') {
            // 主结果显示日期
            outputResult.textContent = formattedString;
        } else {
            // 主结果显示时间戳
            // 根据输出单位选择
            const outUnit = getOutputUnit();
            if (outUnit === 'seconds') {
                outputResult.textContent = Math.floor(date.getTime() / 1000);
            } else {
                outputResult.textContent = date.getTime();
            }
        }

        // 详细信息 (总是显示所有)
        tsSeconds.textContent = Math.floor(date.getTime() / 1000);
        tsMillis.textContent = date.getTime();
        try {
            utcTime.textContent = date.toISOString().replace('T', ' ').replace('z', '').replace(/\.\d{3}Z/, ' UTC');
        } catch (e) { utcTime.textContent = "Invalid"; }

        resultContainer.style.display = 'flex';
    }

    function showError(msg) {
        outputResult.textContent = msg;
        tsSeconds.textContent = "-";
        tsMillis.textContent = "-";
        utcTime.textContent = "-";
        resultContainer.style.display = 'flex';
    }

    function hideResult() {
        resultContainer.style.display = 'none';
    }

    function setupCopyButtons() {
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.getAttribute('data-target');
                const targetEl = document.getElementById(targetId);
                if (targetEl && targetEl.textContent) {
                    navigator.clipboard.writeText(targetEl.textContent).then(() => {
                        const originalText = btn.textContent;
                        btn.textContent = '✅';
                        setTimeout(() => btn.textContent = originalText, 1500);
                    });
                }
            });
        });
    }
});
