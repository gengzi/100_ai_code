"""
抖音视频下载器 - 主应用
使用FastAPI构建REST API
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import os
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

from services.douyin_service import DouyinService
from services.baidu_service import BaiduService
from services.task_manager import TaskManager

app = FastAPI(title="抖音视频下载器 API", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局服务实例
# 指定f2配置文件路径（可选）
# 优先使用环境变量 F2_CONFIG_PATH，否则使用项目中的配置文件
f2_config_path = os.getenv("F2_CONFIG_PATH", os.path.join(os.path.dirname(__file__), "f2_config.yaml"))
logger.info(f"初始化抖音视频服务，配置文件: {f2_config_path}")
douyin_service = DouyinService(config_path=f2_config_path)
baidu_service = BaiduService()
task_manager = TaskManager()
logger.info("所有服务初始化完成")


class DownloadSettings(BaseModel):
    """下载设置"""
    quality: str = "1080p"
    downloadVideo: bool = True
    downloadCover: bool = False
    downloadDescription: bool = False
    downloadAudio: bool = False
    formatConversion: str = "none"
    uploadToBaidu: bool = True
    baiduPath: str = "/抖音视频"


class DownloadRequest(BaseModel):
    """下载请求"""
    urls: List[str]
    settings: DownloadSettings


class ProgressItem(BaseModel):
    """进度项"""
    url: str
    title: Optional[str] = None
    status: str  # pending, downloading, completed, error
    progress: int
    currentStep: str
    baiduUrl: Optional[str] = None


@app.get("/")
async def root():
    """健康检查"""
    return {
        "message": "抖音视频下载器 API",
        "version": "1.0.0",
        "status": "running"
    }


@app.post("/api/download")
async def download_videos(request: DownloadRequest):
    """
    提交下载任务

    参数:
        request: 下载请求对象，包含URL列表和下载设置

    返回:
        任务ID和状态
    """
    try:
        # 生成任务ID
        task_id = str(uuid.uuid4())

        # 初始化任务进度
        task_manager.create_task(task_id, request.urls, request.settings)

        # 异步处理下载任务
        for idx, url in enumerate(request.urls):
            task_manager.update_progress(
                task_id,
                idx,
                {
                    "status": "pending",
                    "progress": 0,
                    "currentStep": "等待处理..."
                }
            )

        # 启动异步任务处理（在实际项目中应该使用Celery或类似工具）
        import asyncio
        asyncio.create_task(process_download_task(task_id, request.urls, request.settings))

        return {
            "success": True,
            "taskId": task_id,
            "message": f"成功提交 {len(request.urls)} 个视频下载任务"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/progress/{task_id}")
async def get_progress(task_id: str):
    """
    获取任务进度

    参数:
        task_id: 任务ID

    返回:
        任务进度信息
    """
    try:
        progress = task_manager.get_task_progress(task_id)

        if progress is None:
            raise HTTPException(status_code=404, detail="任务不存在")

        return {
            "success": True,
            "progress": progress
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tasks")
async def get_all_tasks():
    """
    获取所有任务

    返回:
        任务列表
    """
    try:
        tasks = task_manager.get_all_tasks()

        return {
            "success": True,
            "tasks": tasks
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    """
    删除任务

    参数:
        task_id: 任务ID

    返回:
        删除结果
    """
    try:
        success = task_manager.delete_task(task_id)

        if not success:
            raise HTTPException(status_code=404, detail="任务不存在")

        return {
            "success": True,
            "message": "任务已删除"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def process_download_task(task_id: str, urls: List[str], settings: DownloadSettings):
    """
    处理下载任务（异步）

    参数:
        task_id: 任务ID
        urls: 视频URL列表
        settings: 下载设置
    """
    import asyncio

    for idx, url in enumerate(urls):
        try:
            # 更新状态为下载中
            task_manager.update_progress(
                task_id,
                idx,
                {
                    "status": "downloading",
                    "progress": 10,
                    "currentStep": "解析视频链接..."
                }
            )

            # 使用抖音服务解析和下载视频
            video_info = await douyin_service.download_video(
                url=url,
                quality=settings.quality,
                download_video=settings.downloadVideo,
                download_cover=settings.downloadCover,
                download_description=settings.downloadDescription,
                download_audio=settings.downloadAudio,
                format_conversion=settings.formatConversion
            )

            # 更新进度
            task_manager.update_progress(
                task_id,
                idx,
                {
                    "status": "downloading",
                    "progress": 90,
                    "currentStep": "下载完成...",
                    "title": video_info.get("title", "未知视频")
                }
            )

            # 上传到百度网盘功能已暂时关闭
            # 如果需要上传到百度网盘
            # baidu_url = None
            # if settings.uploadToBaidu and video_info.get("video_path"):
            #     task_manager.update_progress(
            #         task_id,
            #         idx,
            #         {
            #             "status": "downloading",
            #             "progress": 70,
            #             "currentStep": "上传到百度网盘..."
            #         }
            #     )
            #
            #     baidu_url = await baidu_service.upload_video(
            #         file_path=video_info["video_path"],
            #         remote_path=settings.baiduPath
            #     )

            # 更新为完成状态
            task_manager.update_progress(
                task_id,
                idx,
                {
                    "status": "completed",
                    "progress": 100,
                    "currentStep": "已完成",
                    "title": video_info.get("title", "未知视频"),
                    "baiduUrl": None
                }
            )

        except Exception as e:
            # 更新为错误状态
            task_manager.update_progress(
                task_id,
                idx,
                {
                    "status": "error",
                    "progress": 0,
                    "currentStep": f"错误: {str(e)}"
                }
            )

        # 短暂延迟避免请求过快
        await asyncio.sleep(0.5)


if __name__ == "__main__":
    import uvicorn
    import asyncio

    # 修复 PyCharm 调试器兼容性问题
    config = uvicorn.Config(app, host="0.0.0.0", port=5000, log_level="info")
    server = uvicorn.Server(config)

    # 使用 asyncio.run（兼容调试器）
    asyncio.run(server.serve())
