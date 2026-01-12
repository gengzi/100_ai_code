// API基础URL
const API_BASE_URL = 'http://localhost:5000/api';

// 显示Toast通知
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 清空输入
function clearInput() {
    document.getElementById('videoUrls').value = '';
    showToast('输入已清空', 'info');
}

// 获取下载设置
function getDownloadSettings() {
    return {
        quality: document.querySelector('input[name="quality"]:checked').value,
        downloadVideo: document.getElementById('downloadVideo').checked,
        downloadCover: document.getElementById('downloadCover').checked,
        downloadDescription: document.getElementById('downloadDescription').checked,
        downloadAudio: document.getElementById('downloadAudio').checked,
        formatConversion: document.getElementById('formatConversion').value,
        uploadToBaidu: document.getElementById('uploadToBaidu').checked,
        baiduPath: document.getElementById('baiduPath').value
    };
}

// 开始下载
async function startDownload() {
    const videoUrls = document.getElementById('videoUrls').value.trim();

    if (!videoUrls) {
        showToast('请输入视频链接', 'error');
        return;
    }

    const urls = videoUrls.split('\n').filter(url => url.trim()).map(url => url.trim());

    if (urls.length === 0) {
        showToast('请输入有效的视频链接', 'error');
        return;
    }

    const settings = getDownloadSettings();

    try {
        showToast('开始处理视频...', 'info');

        const response = await fetch(`${API_BASE_URL}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                urls: urls,
                settings: settings
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast(`成功提交 ${urls.length} 个视频任务`, 'success');
            document.getElementById('progressCard').style.display = 'block';

            // 开始轮询进度
            startProgressPolling(data.taskId);
        } else {
            showToast(data.message || '下载失败', 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        showToast('网络错误，请检查后端服务是否启动', 'error');
    }
}

// 轮询进度
let progressInterval = null;

function startProgressPolling(taskId) {
    // 清除之前的轮询
    if (progressInterval) {
        clearInterval(progressInterval);
    }

    // 立即获取一次进度
    updateProgress(taskId);

    // 每2秒更新一次进度
    progressInterval = setInterval(() => {
        updateProgress(taskId);
    }, 2000);
}

async function updateProgress(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/progress/${taskId}`);
        const data = await response.json();

        if (data.success) {
            displayProgress(data.progress);

            // 如果所有任务都完成，停止轮询
            const allCompleted = data.progress.every(item => item.status === 'completed' || item.status === 'error');
            if (allCompleted) {
                clearInterval(progressInterval);
                showToast('所有任务已完成', 'success');
            }
        }
    } catch (error) {
        console.error('Progress update error:', error);
    }
}

// 显示进度
function displayProgress(progressData) {
    const progressContent = document.getElementById('progressContent');
    progressContent.innerHTML = '';

    progressData.forEach(item => {
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';

        const statusClass = item.status === 'completed' ? 'completed' : (item.status === 'error' ? 'error' : '');
        const statusText = item.status === 'completed' ? '已完成' : (item.status === 'error' ? '失败' : '处理中');
        const progressBarClass = item.status === 'completed' ? 'completed' : '';

        progressItem.innerHTML = `
            <div class="progress-item-header">
                <span class="progress-item-title">${item.title || '视频'}</span>
                <span class="progress-item-status ${statusClass}">${statusText}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar ${progressBarClass}" style="width: ${item.progress}%"></div>
            </div>
            <div class="progress-info">
                <span>${item.currentStep || '初始化中...'}</span>
                <span>${item.progress}%</span>
            </div>
            ${item.baiduUrl ? `
                <div class="progress-info" style="margin-top: 8px; color: #0066ff;">
                    <span>百度网盘: <a href="${item.baiduUrl}" target="_blank" style="color: #0066ff;">点击查看</a></span>
                </div>
            ` : ''}
        `;

        progressContent.appendChild(progressItem);
    });
}

// 查看进度
async function checkProgress() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        const data = await response.json();

        if (data.success && data.tasks.length > 0) {
            document.getElementById('progressCard').style.display = 'block';

            // 获取最近一个任务的进度
            const latestTask = data.tasks[0];
            updateProgress(latestTask.taskId);
        } else {
            showToast('暂无下载任务', 'info');
        }
    } catch (error) {
        console.error('Check progress error:', error);
        showToast('获取进度失败', 'error');
    }
}

// 页面加载时检查是否有未完成的任务
document.addEventListener('DOMContentLoaded', () => {
    checkProgress();
});
