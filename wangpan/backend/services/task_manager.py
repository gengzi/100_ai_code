"""
任务管理器
管理下载任务的进度和状态
"""
from typing import List, Dict, Optional
from datetime import datetime
import threading


class TaskManager:
    """任务管理器"""

    def __init__(self):
        """初始化任务管理器"""
        self.tasks: Dict[str, Dict] = {}
        self.lock = threading.Lock()

    def create_task(self, task_id: str, urls: List[str], settings):
        """
        创建新任务

        参数:
            task_id: 任务ID
            urls: URL列表
            settings: 下载设置
        """
        with self.lock:
            self.tasks[task_id] = {
                "taskId": task_id,
                "urls": urls,
                "settings": settings,
                "createdAt": datetime.now().isoformat(),
                "progress": [
                    {
                        "url": url,
                        "title": None,
                        "status": "pending",
                        "progress": 0,
                        "currentStep": "等待处理...",
                        "baiduUrl": None
                    }
                    for url in urls
                ]
            }

    def update_progress(self, task_id: str, index: int, updates: Dict):
        """
        更新任务进度

        参数:
            task_id: 任务ID
            index: 视频索引
            updates: 更新内容
        """
        with self.lock:
            if task_id in self.tasks and 0 <= index < len(self.tasks[task_id]["progress"]):
                self.tasks[task_id]["progress"][index].update(updates)

    def get_task_progress(self, task_id: str) -> Optional[List[Dict]]:
        """
        获取任务进度

        参数:
            task_id: 任务ID

        返回:
            进度列表，如果任务不存在返回None
        """
        with self.lock:
            if task_id in self.tasks:
                return self.tasks[task_id]["progress"]
            return None

    def get_all_tasks(self) -> List[Dict]:
        """
        获取所有任务

        返回:
            任务列表
        """
        with self.lock:
            return [
                {
                    "taskId": task_id,
                    "createdAt": task["createdAt"],
                    "urlCount": len(task["urls"]),
                    "completedCount": sum(
                        1 for p in task["progress"]
                        if p["status"] in ["completed", "error"]
                    )
                }
                for task_id, task in self.tasks.items()
            ]

    def delete_task(self, task_id: str) -> bool:
        """
        删除任务

        参数:
            task_id: 任务ID

        返回:
            是否成功删除
        """
        with self.lock:
            if task_id in self.tasks:
                del self.tasks[task_id]
                return True
            return False
