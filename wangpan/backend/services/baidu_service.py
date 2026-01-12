"""
百度网盘服务 - 使用官方SDK
参考文档: https://pan.baidu.com/union/doc/Kl4gsu388
"""
import sys
import os
from pathlib import Path
from typing import Optional
import logging
import hashlib
import json

# 添加SDK路径
sdk_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "pythonsdk_20220616")
if sdk_path not in sys.path:
    sys.path.insert(0, sdk_path)

# 导入官方SDK
import openapi_client
from openapi_client.api import fileupload_api
from openapi_client import ApiException

logger = logging.getLogger(__name__)


class BaiduService:
    """百度网盘服务 - 使用官方SDK"""

    def __init__(self):
        """初始化服务"""
        # 百度网盘API配置
        self.app_key = os.getenv("BAIDU_APP_KEY", "FDSJDDS4x3nzNPxb4GRw2gXvRaT7wDEH")
        self.secret_key = os.getenv("BAIDU_SECRET_KEY", "svgZqRG0a8kcB6gOn6eQvOYf45eTN0kJ")
        self.access_token = os.getenv("BAIDU_ACCESS_TOKEN", "u7HJPNIO!7dSoo1Kc~F7tAEQQH@tNhND")

        logger.info(f"百度网盘服务初始化 - app_key: {self.app_key[:10]}...")
        logger.info(f"access_token: {self.access_token[:20]}...")
        logger.info(f"SDK路径: {sdk_path}")

    async def upload_video(self, file_path: str, remote_path: str) -> Optional[str]:
        """
        上传视频到百度网盘

        参数:
            file_path: 本地文件路径
            remote_path: 远程路径（百度网盘中的路径）

        返回:
            上传结果或None
        """
        try:
            logger.info(f"开始上传到百度网盘")
            logger.info(f"本地文件: {file_path}")
            logger.info(f"远程路径: {remote_path}")

            # 检查文件是否存在
            file_path_obj = Path(file_path)
            if not file_path_obj.exists():
                logger.error(f"文件不存在: {file_path}")
                raise FileNotFoundError(f"文件不存在: {file_path}")

            file_size = file_path_obj.stat().st_size
            logger.info(f"文件大小: {file_size / 1024 / 1024:.2f} MB")

            # 计算分片MD5
            logger.info("计算文件MD5...")
            block_list = self._split_file_md5(file_path_obj)
            block_list_str = json.dumps(block_list)
            logger.info(f"分片数量: {len(block_list)}")

            # 1. 预上传 - 获取uploadid
            logger.info("步骤1: 预上传 (precreate)")
            uploadid = await self._pre_upload(remote_path, file_size, block_list_str)

            # 2. 获取上传域名
            logger.info("步骤2: 获取上传域名 (locateupload)")
            upload_host = await self._get_upload_host(remote_path, uploadid)
            logger.info(f"使用上传域名: {upload_host}")

            # 3. 分片上传
            logger.info("步骤3: 分片上传 (upload)")
            await self._upload_slices(file_path_obj, remote_path, uploadid, block_list, upload_host)

            # 4. 创建文件
            logger.info("步骤4: 创建文件 (create)")
            await self._create_file(remote_path, file_size, uploadid, block_list_str)

            logger.info("上传完成！")
            return f"已上传到百度网盘: {remote_path}"

        except ApiException as e:
            logger.error(f"百度网盘API错误: {e}")
            raise Exception(f"百度网盘API错误: {e}")
        except Exception as e:
            logger.error(f"上传到百度网盘失败: {str(e)}", exc_info=True)
            raise Exception(f"上传到百度网盘失败: {str(e)}")

    def _split_file_md5(self, file_path: Path, chunk_size=4*1024*1024) -> list:
        """
        计算分片MD5列表

        参数:
            file_path: 文件路径
            chunk_size: 分片大小（默认4MB）

        返回:
            MD5列表
        """
        md5_list = []
        with open(file_path, 'rb') as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                md5 = hashlib.md5(chunk)
                md5_list.append(md5.hexdigest())
        return md5_list

    async def _pre_upload(self, path: str, size: int, block_list: str) -> str:
        """
        预上传 - 获取uploadid

        参数:
            path: 远程文件路径
            size: 文件大小
            block_list: MD5列表的JSON字符串

        返回:
            uploadid
        """
        with openapi_client.ApiClient() as api_client:
            api_instance = fileupload_api.FileuploadApi(api_client)

            logger.info(f"预上传参数: path={path}, size={size}, block_list={block_list[:100]}...")

            try:
                api_response = api_instance.xpanfileprecreate(
                    self.access_token,
                    path,
                    0,  # isdir
                    size,
                    1,  # autoinit
                    block_list,
                    rtype=3  # 覆盖同名文件
                )
                logger.info(f"预上传响应: {api_response}")

                if hasattr(api_response, 'errno') and api_response.errno != 0:
                    error_msg = getattr(api_response, 'errmsg', '未知错误')
                    raise Exception(f"预上传失败: {error_msg}")

                uploadid = getattr(api_response, 'uploadid', None)
                if not uploadid:
                    raise Exception("预上传失败: 未返回uploadid")

                logger.info(f"预上传成功，uploadid: {uploadid}")
                return uploadid

            except ApiException as e:
                logger.error(f"预上传API异常: {e}")
                raise

    async def _upload_slices(self, file_path: Path, path: str, uploadid: str, block_list: list, upload_host: str):
        """
        分片上传

        参数:
            file_path: 本地文件路径
            path: 远程文件路径
            uploadid: 上传ID
            block_list: MD5列表
            upload_host: 上传域名
        """
        import aiohttp
        import io

        chunk_size = 4 * 1024 * 1024  # 4MB

        logger.info(f"开始分片上传，使用域名: {upload_host}")

        # 读取文件并分片上传
        with open(file_path, 'rb') as f:
            for partseq, _ in enumerate(block_list):
                chunk = f.read(chunk_size)
                if not chunk:
                    break

                logger.info(f"上传分片 {partseq + 1}/{len(block_list)}，大小: {len(chunk)} 字节")

                try:
                    # 创建文件对象
                    file_for_upload = io.BytesIO(chunk)

                    # 构建上传URL
                    upload_url = f"{upload_host}/rest/2.0/pcs/superfile2"
                    params = {
                        "method": "upload",
                        "access_token": self.access_token,
                        "type": "tmpfile",
                        "path": path,
                        "uploadid": uploadid,
                        "partseq": str(partseq)
                    }

                    # 使用multipart/form-data上传
                    files = {
                        'file': (file_path.name, file_for_upload, 'application/octet-stream')
                    }

                    async with aiohttp.ClientSession() as session:
                        async with session.post(upload_url, params=params, data=files) as response:
                            result = await response.json()
                            logger.info(f"分片 {partseq} 响应: {result}")

                            if result.get("errno") != 0:
                                error_msg = result.get("errmsg", "未知错误")
                                raise Exception(f"分片 {partseq} 上传失败: {error_msg}")

                            logger.info(f"分片 {partseq} 上传成功，MD5: {result.get('md5')}")

                except Exception as e:
                    logger.error(f"分片 {partseq} 上传失败: {e}")
                    raise

        logger.info("所有分片上传完成")

    async def _get_upload_host(self, path: str, uploadid: str) -> str:
        """
        获取上传域名

        参数:
            path: 远程文件路径
            uploadid: 上传ID

        返回:
            上传域名
        """
        import aiohttp
        from urllib.parse import quote

        url = "https://d.pcs.baidu.com/rest/2.0/pcs/file"
        params = {
            "method": "locateupload",
            "appid": 250528,  # 固定值
            "access_token": self.access_token,
            "path": path,
            "uploadid": uploadid,
            "upload_version": "2.0"
        }

        logger.info(f"获取上传域名URL: {url}")
        logger.info(f"参数: path={path}, uploadid={uploadid}")

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                result = await response.json()
                logger.info(f"获取上传域名响应: {result}")

                if result.get("error_code") != 0:
                    error_msg = result.get("error_msg", "未知错误")
                    raise Exception(f"获取上传域名失败: {error_msg}")

                # 从servers列表中选择第一个https协议的域名
                servers = result.get("servers", [])
                if not servers:
                    raise Exception("未获取到上传域名")

                # 查找https协议的域名
                for server_info in servers:
                    server = server_info.get("server", "")
                    if server.startswith("https://"):
                        upload_host = server.rstrip("/")
                        logger.info(f"选择上传域名: {upload_host}")
                        return upload_host

                # 如果没有https的，使用第一个
                upload_host = servers[0].get("server", "https://c.pcs.baidu.com")
                if not upload_host.startswith("https://"):
                    upload_host = "https://" + upload_host
                upload_host = upload_host.rstrip("/")

                logger.info(f"使用上传域名: {upload_host}")
                return upload_host

    async def _create_file(self, path: str, size: int, uploadid: str, block_list: str):
        """
        创建文件

        参数:
            path: 远程文件路径
            size: 文件大小
            uploadid: 上传ID
            block_list: MD5列表的JSON字符串
        """
        with openapi_client.ApiClient() as api_client:
            api_instance = fileupload_api.FileuploadApi(api_client)

            logger.info(f"创建文件参数: path={path}, size={size}")

            try:
                api_response = api_instance.xpanfilecreate(
                    self.access_token,
                    path,
                    0,  # isdir
                    size,
                    uploadid,
                    block_list,
                    rtype=3  # 覆盖同名文件
                )
                logger.info(f"创建文件响应: {api_response}")

                if hasattr(api_response, 'errno') and api_response.errno != 0:
                    error_msg = getattr(api_response, 'errmsg', '未知错误')
                    raise Exception(f"创建文件失败: {error_msg}")

                logger.info("文件创建成功")

            except ApiException as e:
                logger.error(f"创建文件API异常: {e}")
                raise

    def get_access_token(self) -> str:
        """获取访问令牌"""
        return self.access_token

    async def refresh_access_token(self) -> bool:
        """刷新访问令牌"""
        import aiohttp

        url = "https://openapi.baidu.com/oauth/2.0/token"
        params = {
            "grant_type": "client_credentials",
            "client_id": self.app_key,
            "client_secret": self.secret_key
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                result = await response.json()

                if "access_token" in result:
                    self.access_token = result["access_token"]
                    logger.info("访问令牌刷新成功")
                    return True

        logger.error("访问令牌刷新失败")
        return False
