"""
抖音视频服务 - 使用f2库
负责解析和下载抖音视频
"""
import asyncio
import os
from typing import Dict, Optional
from pathlib import Path

# 导入f2相关模块
import f2
from f2.apps.douyin.handler import DouyinHandler
from f2.log.logger import logger, log_setup

# 配置f2日志输出到控制台，并设置为INFO级别
logger = log_setup(log_to_console=True)
logger.setLevel("INFO")  # 设置为 INFO 级别，也可以使用 DEBUG 获取更详细的日志


class DouyinService:
    """抖音视频服务 - 基于f2库"""

    def __init__(self, config_path: str = None):
        """
        初始化服务

        参数:
            config_path: f2配置文件路径（可选）
        """
        self.download_dir = Path("F:\BaiduSyncdisk")
        self.download_dir.mkdir(exist_ok=True)

        # 指定f2配置文件路径
        if config_path:
            f2.APP_CONFIG_FILE_PATH = config_path
            logger.info(f"使用f2配置文件: {config_path}")

        # 获取Cookie（优先从环境变量，否则使用配置文件）
        cookie = os.getenv("DOUYIN_COOKIE", "UIFID_TEMP=5a0fbbb49c6c57acd77ca86d66dd2e8e2f1fcf7b3fa6b8a56e480f684bd0858905ec3d4ec8e1f9d840959eb648c69c65bb16b1e54e958fcf23383cb0a30fb667b10511a181f9a1e22de5213587d0bf28; hevc_supported=true; bd_ticket_guard_client_web_domain=2; d_ticket=d48a0b02b929c237264501c0d31805ca9a569; UIFID=5a0fbbb49c6c57acd77ca86d66dd2e8e2f1fcf7b3fa6b8a56e480f684bd0858905ec3d4ec8e1f9d840959eb648c69c65927e5b39a191ed1461883ea9abe57a6eef574935243b6f4b43c926b57496d73d94b7e5f92ef94fb0c9245950f4aa8667b1bcf0f7be144cac71de8a507191643296ad036cc24cc58b50de42c47f10b9c43072d648ccd4b6fe6d42f61b3ac1605c0753c7a6f069090782dec69f34ebd411; passport_assist_user=Cj1M7-RxbDYgAar9V-ScyiXpucfl3yJCyb_ZsFPrffWI1wbxEZ-9-smz1-vkn-LQvf7G8pO0Uz4-ffBR-jbaGkoKPArHIJec9TGfWL01VoZe0f8IKcSb3ktqjzJUJeGqWlDMcbs8wnh9KItnQoVEvObX8dHplLWnJLneocSY7BDckuoNGImv1lQgASIBAyFquRs%3D; uid_tt=8ca6d819701fc21a3afafff1418d8f8f; uid_tt_ss=8ca6d819701fc21a3afafff1418d8f8f; sid_tt=bba2931fffc8a4cec6fe4b616cfa8a5b; sessionid=bba2931fffc8a4cec6fe4b616cfa8a5b; sessionid_ss=bba2931fffc8a4cec6fe4b616cfa8a5b; is_staff_user=false; store-region=cn-bj; store-region-src=uid; login_time=1740132773139; SelfTabRedDotControl=%5B%5D; live_use_vvc=%22false%22; SEARCH_RESULT_LIST_TYPE=%22single%22; enter_pc_once=1; my_rd=2; passport_csrf_token=87e8216b533661ba0812ad95dcdc763a; passport_csrf_token_default=87e8216b533661ba0812ad95dcdc763a; session_tlb_tag_bk=sttt%7C20%7Cu6KTH__IpM7G_kthbPqKW__________y-GpVNr4yiBuAvOthpR7IXDQd8WL_xjX1QJcKRLr9Ajw%3D; _bd_ticket_crypt_cookie=2c92bb4d8fc6878d1123b807e5d7b0b6; __live_version__=%221.1.4.4657%22; sid_guard=bba2931fffc8a4cec6fe4b616cfa8a5b%7C1767084550%7C5184000%7CSat%2C+28-Feb-2026+08%3A49%3A10+GMT; session_tlb_tag=sttt%7C13%7Cu6KTH__IpM7G_kthbPqKW__________BHR9let_Uly6uj-ExfzGRWQF7TYHjQ5c__lXZuFFjL4c%3D; sid_ucp_v1=1.0.0-KDQ4NDZiODc4OTgxZWQxYTllNmRiMDkzYjE1MGQ1M2NiZDM1NGY5YmMKHwjJ3O_zigMQhqTOygYY7zEgDDC7s-zeBTgHQPQHSAQaAmhsIiBiYmEyOTMxZmZmYzhhNGNlYzZmZTRiNjE2Y2ZhOGE1Yg; ssid_ucp_v1=1.0.0-KDQ4NDZiODc4OTgxZWQxYTllNmRiMDkzYjE1MGQ1M2NiZDM1NGY5YmMKHwjJ3O_zigMQhqTOygYY7zEgDDC7s-zeBTgHQPQHSAQaAmhsIiBiYmEyOTMxZmZmYzhhNGNlYzZmZTRiNjE2Y2ZhOGE1Yg; is_dash_user=1; strategyABtestKey=%221767978470.283%22; publish_badge_show_info=%221%2C0%2C0%2C1767978469843%22; __security_mc_1_s_sdk_crypt_sdk=0e73d0cd-4f1c-a1e8; __security_mc_1_s_sdk_cert_key=a21f8caf-4dc3-9fff; __security_mc_1_s_sdk_sign_data_key_web_protect=6c08d093-439e-9ee2; volume_info=%7B%22isUserMute%22%3Afalse%2C%22isMute%22%3Afalse%2C%22volume%22%3A0.6%7D; ttwid=1%7Cng9OrlCI_DWK5kfIJM4uMjgRuYwY2s380YmjQY08i9k%7C1767979717%7Cb70592ba7a6757f57407596b34f3e085cb50358bee086b520e4fb3b3f46f7e31; __druidClientInfo=JTdCJTIyY2xpZW50V2lkdGglMjIlM0E2NTYlMkMlMjJjbGllbnRIZWlnaHQlMjIlM0ExMjM3JTJDJTIyd2lkdGglMjIlM0E2NTYlMkMlMjJoZWlnaHQlMjIlM0ExMjM3JTJDJTIyZGV2aWNlUGl4ZWxSYXRpbyUyMiUzQTEuNSUyQyUyMnVzZXJBZ2VudCUyMiUzQSUyMk1vemlsbGElMkY1LjAlMjAoV2luZG93cyUyME5UJTIwMTAuMCUzQiUyMFdpbjY0JTNCJTIweDY0KSUyMEFwcGxlV2ViS2l0JTJGNTM3LjM2JTIwKEtIVE1MJTJDJTIwbGlrZSUyMEdlY2tvKSUyMENocm9tZSUyRjE0My4wLjAuMCUyMFNhZmFyaSUyRjUzNy4zNiUyMiU3RA==; FOLLOW_NUMBER_YELLOW_POINT_INFO=%22MS4wLjABAAAAr_W-rxd3-iuJmJY166G3qMS9jWegHkzES6b7msaX1KA%2F1768060800000%2F0%2F1768026534042%2F0%22; biz_trace_id=9f998988; playRecommendGuideTagCount=2; totalRecommendGuideTagCount=2; gulu_source_res=eyJwX2luIjoiMzRlYjBiNWI5YTNlY2RkMjY3ZGQzOTBkNjhjMjk1MGIzMjY2YmUyMDc3MWViYmZlMTIzNDM4ZDMxZmNkYTVjOCJ9; sdk_source_info=7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e582729277672715a646971273f2763646976602729277f6b5a666475273f2763646976602729276d6a6e5a6b6a716c273f2763646976602729276c6b6f5a7f6367273f27636469766027292771273f27353d3c33323d3237353d333234272927676c715a75776a716a666a69273f2763646976602778; bit_env=OP_qewnNP3zxx2LZPMWi5PQaFT6W5dWbmCuX1A8-0u4zn3LtSu_lPrxmLGqQPETaNf5PFk2e_J8fQod_7xYFTRr8erC0GpJGYTM1DynJAzo_lMGKJqq9zdHfr2Wysjhp9_0M0f4DdnjgJw0WKmD1MstDakqdp0ar2xrvUklth_YWix-YlD_XhAzX9-GU2TvUPmO0NyMj_5KIff9WKRJeWg_ObA389nDs6pTPSZp8bFAQQ9c28EmwU1LuxYssLA44OQOcaIEaVwVAP0epGFGTHgtRHUqUCdeihlXSBXjFAKM5Vf8V-VZGF2agTtfJlzT3FFCRMP0qbv5qhSKShyYU0F5xkFhNlrxtbuCV68skQ-IIa0PkCpqsOIYPI6CzUdwUfsRcF9olHV9vYeH3vx6D1zYTXWfwgb-AHAk33KeCFmUletTtowPKNrjvD3EhoWpVj-N6ZL_3212FWNjV3NPlYZ-ycSIZuDxdiMb3KSlPZH8CO8uZT4yQ57ijIo2tK50k; passport_auth_mix_state=h8y47ppe17nfrbmkih03qwlvlpumcjh8nf5kupyygef95p55; IsDouyinActive=true; stream_recommend_feed_params=%22%7B%5C%22cookie_enabled%5C%22%3Atrue%2C%5C%22screen_width%5C%22%3A2560%2C%5C%22screen_height%5C%22%3A1440%2C%5C%22browser_online%5C%22%3Atrue%2C%5C%22cpu_core_num%5C%22%3A20%2C%5C%22device_memory%5C%22%3A8%2C%5C%22downlink%5C%22%3A10%2C%5C%22effective_type%5C%22%3A%5C%224g%5C%22%2C%5C%22round_trip_time%5C%22%3A0%7D%22; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCSHBCSUZTdXM5eWYrRzFsSTRnTm00c09uYm83N1o1ZSszdXZDTFVucTJmb2dIS3FldE9laU5KN3EvS0NLbFdiZ1BiQ0FyeGJCNTVyKy9hdEdmODFkN1U9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; FOLLOW_LIVE_POINT_INFO=%22MS4wLjABAAAAr_W-rxd3-iuJmJY166G3qMS9jWegHkzES6b7msaX1KA%2F1768060800000%2F0%2F1768028103318%2F0%22; bd_ticket_guard_client_data_v2=eyJyZWVfcHVibGljX2tleSI6IkJIcEJJRlN1czl5ZitHMWxJNGdObTRzT25ibzc3WjVlKzN1dkNMVW5xMmZvZ0hLcWV0T2VpTko3cS9LQ0tsV2JnUGJDQXJ4YkI1NXIrL2F0R2Y4MWQ3VT0iLCJ0c19zaWduIjoidHMuMi5mZDg1OWNjNGYyNmYwNzI4ZGYxZDhhYWE0ZmVkZmYwZTBhZGNkOGQ5ZDk0NGE3YzY1ZjdkYTliNTVkYWM5YzA4YzRmYmU4N2QyMzE5Y2YwNTMxODYyNGNlZGExNDkxMWNhNDA2ZGVkYmViZWRkYjJlMzBmY2U4ZDRmYTAyNTc1ZCIsInJlcV9jb250ZW50Ijoic2VjX3RzIiwicmVxX3NpZ24iOiJIdEN3WFY2NmtkZVR0S2VwbEMvYXlrUU1OWlMzZG5oRzZDOEx2WGZBaDQ4PSIsInNlY190cyI6IiNxZWRRbFpzakt0cUNTbGZrWWtNb09jZTRVTWUxSkN6YkVuYTZZN3kvTEg2YjdtOEo0NmJhSEhmK0pyMlYifQ%3D%3D; odin_tt=971da53daa2f8ed9721e490ad1f20091e379d4d563891c4aea2b127e3fc1834c2a1f405fe1866ed4133a0d4cf11294e0229fe13ede177c3c238e72b54a33b3d3; home_can_add_dy_2_desktop=%221%22")

        # 初始化f2处理器参数
        self.kwargs = {
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://www.douyin.com/",
            },
            "proxies": {
                "http": os.getenv("HTTP_PROXY"),
                "https": os.getenv("HTTPS_PROXY")
            },
            "cookie": cookie,
        }

        # 移除None值的代理设置
        if not self.kwargs["proxies"]["http"]:
            self.kwargs["proxies"]["http"] = None
        if not self.kwargs["proxies"]["https"]:
            self.kwargs["proxies"]["https"] = None

        # 初始化DouyinHandler
        self.handler = DouyinHandler(self.kwargs)

        logger.info("抖音视频服务初始化完成（使用f2库）")

    async def download_video(
        self,
        url: str,
        quality: str = "1080p",
        download_video: bool = True,
        download_cover: bool = False,
        download_description: bool = False,
        download_audio: bool = False,
        format_conversion: str = "none"
    ) -> Dict:
        """
        下载抖音视频 - 使用f2库

        参数:
            url: 视频URL
            quality: 视频清晰度
            download_video: 是否下载视频
            download_cover: 是否下载封面
            download_description: 是否下载文案
            download_audio: 是否下载音频
            format_conversion: 格式转换选项

        返回:
            视频信息字典
        """
        try:
            logger.info(f"开始下载视频: {url}")

            # 从URL中提取aweme_id
            aweme_id = await self._extract_aweme_id(url)
            if not aweme_id:
                raise ValueError(f"无法从URL中提取视频ID: {url}")

            logger.info(f"提取到视频ID: {aweme_id}")

            # 使用f2的handler获取单个视频信息（传入aweme_id）
            video_data = await self.handler.fetch_one_video(aweme_id)

            if not video_data:
                raise ValueError(f"无法获取视频信息: {url}")

            # 解析f2返回的数据
            video_info = self._parse_f2_data(video_data)

            # 下载视频文件
            video_path = None
            if download_video and video_info.get("video_url"):
                video_path = await self._download_video_file(
                    video_info["video_url"],
                    video_info.get("title", "video")
                )
                logger.info(f"视频下载完成: {video_path}")

            # 下载封面
            cover_path = None
            if download_cover and video_info.get("cover_url"):
                cover_path = await self._download_cover(
                    video_info["cover_url"],
                    video_info.get("video_id", "cover")
                )
                logger.info(f"封面下载完成: {cover_path}")

            # 保存文案
            description_path = None
            if download_description and video_info.get("description"):
                description_path = await self._save_description(
                    video_info["description"],
                    video_info.get("video_id", "desc")
                )
                logger.info(f"文案保存完成: {description_path}")

            # 下载音频
            audio_path = None
            if download_audio and video_info.get("audio_url"):
                audio_path = await self._download_audio(
                    video_info["audio_url"],
                    video_info.get("video_id", "audio")
                )
                logger.info(f"音频下载完成: {audio_path}")

            # 格式转换
            if format_conversion != "none" and video_path:
                video_path = await self._convert_format(video_path, format_conversion)

            return {
                "title": video_info.get("title", "未知视频"),
                "description": video_info.get("description", ""),
                "video_path": str(video_path) if video_path else None,
                "cover_path": str(cover_path) if cover_path else None,
                "description_path": str(description_path) if description_path else None,
                "audio_path": str(audio_path) if audio_path else None,
                "video_id": video_info.get("video_id", ""),
                "author": video_info.get("author", ""),
            }

        except Exception as e:
            logger.error(f"下载视频失败: {str(e)}")
            raise Exception(f"下载视频失败: {str(e)}")

    async def _extract_aweme_id(self, url: str) -> Optional[str]:
        """
        从抖音URL中提取aweme_id（仅使用正则表达式，不进行网络请求）

        参数:
            url: 抖音视频URL

        返回:
            aweme_id或None
        """
        import re

        try:
            logger.info(f"解析URL: {url}")

            # 只使用正则表达式提取，不进行任何网络请求
            # 支持的URL格式:
            # https://www.douyin.com/video/7300000000000000
            # https://www.douyin.com/video/7300000000000000?previous_page=main
            # https://www.douyin.com/jingxuan?modal_id=7592156499439291657
            # https://www.douyin.com/?aweme_id=7300000000000000
            # https://www.douyin.com/?item_ids=7300000000000000

            patterns = [
                r'/video/(\d+)',  # /video/7300000000000000
                r'/share/video/(\d+)',  # /share/video/7300000000000000
                r'aweme_id=(\d+)',  # aweme_id=7300000000000000
                r'item_ids=(\d+)',  # item_ids=7300000000000000
                r'modal_id=(\d+)',  # modal_id=7592156499439291657 (精选页格式)
            ]

            for pattern in patterns:
                match = re.search(pattern, url)
                if match:
                    aweme_id = match.group(1)
                    logger.info(f"从URL提取到aweme_id: {aweme_id}")
                    return aweme_id

            # 短链接（v.douyin.com）无法通过正则提取
            if "v.douyin.com" in url:
                logger.warning(f"不支持短链接，请使用完整URL（包含 video/ 或 modal_id= 等参数）")

            logger.warning(f"无法从URL提取aweme_id: {url}")
            return None

        except Exception as e:
            logger.error(f"提取aweme_id失败: {str(e)}")
            return None

    def _parse_f2_data(self, f2_data) -> Dict:
        """
        解析f2返回的数据

        参数:
            f2_data: f2返回的原始数据

        返回:
            解析后的视频信息
        """
        try:
            # f2返回的是Filter对象，需要转换为字典
            if hasattr(f2_data, '_to_dict'):
                data = f2_data._to_dict()
            elif hasattr(f2_data, '__dict__'):
                data = f2_data.__dict__
            else:
                data = f2_data

            logger.info(f"f2返回的数据类型: {type(data)}")
            logger.info(f"f2返回的数据键: {data.keys() if isinstance(data, dict) else 'not a dict'}")

            # f2返回的是扁平化数据，直接使用
            # 提取视频ID
            aweme_id = data.get("aweme_id", "")

            # 提取标题/描述
            desc = data.get("desc", "")

            # 提取作者信息
            author = data.get("nickname", "")

            # 提取视频URL - video_play_addr 是一个数组
            video_play_addr = data.get("video_play_addr", [])
            if video_play_addr and len(video_play_addr) > 0:
                video_url = video_play_addr[0]
                logger.info(f"提取到视频URL: {video_url[:200]}...")
                logger.info(f"完整视频URL: {video_url}")  # 打印完整URL
            else:
                video_url = ""
                logger.warning("未找到视频URL")

            # 提取封面URL - cover 直接是字符串
            cover_url = data.get("cover", "")

            # 提取音频URL - music_play_url 直接是字符串
            audio_url = data.get("music_play_url", "")

            return {
                "video_id": aweme_id,
                "title": desc,
                "description": desc,
                "author": author,
                "video_url": video_url,
                "cover_url": cover_url,
                "audio_url": audio_url,
            }

        except Exception as e:
            logger.error(f"解析f2数据失败: {str(e)}")
            return {}

    async def _download_video_file(self, url: str, title: str) -> Path:
        """下载视频文件"""
        import aiohttp

        filename = self._sanitize_filename(title) + ".mp4"
        file_path = self.download_dir / filename

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.douyin.com/",
        }

        logger.info(f"开始下载视频: {url[:100]}...")
        logger.info(f"请求头: {headers}")

        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                logger.info(f"响应状态: {response.status}")
                logger.info(f"响应头: {dict(response.headers)}")

                if response.status == 200:
                    with open(file_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            f.write(chunk)
                    logger.info(f"视频下载完成: {file_path}")
                else:
                    text = await response.text()
                    logger.error(f"下载失败: HTTP {response.status}, 响应内容: {text[:500]}")
                    raise Exception(f"下载失败: HTTP {response.status}")

        return file_path

    async def _download_cover(self, url: str, video_id: str) -> Path:
        """下载封面"""
        import aiohttp

        filename = f"{video_id}_cover.jpg"
        file_path = self.download_dir / filename

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://www.douyin.com/",
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    with open(file_path, 'wb') as f:
                        f.write(await response.read())

        return file_path

    async def _save_description(self, description: str, video_id: str) -> Path:
        """保存文案"""
        filename = f"{video_id}_description.txt"
        file_path = self.download_dir / filename

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(description)

        return file_path

    async def _download_audio(self, url: str, video_id: str) -> Path:
        """下载音频"""
        import aiohttp

        filename = f"{video_id}_audio.mp3"
        file_path = self.download_dir / filename

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://www.douyin.com/",
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    with open(file_path, 'wb') as f:
                        f.write(await response.read())

        return file_path

    async def _convert_format(self, video_path: Path, format_type: str) -> Path:
        """转换视频格式"""
        # TODO: 实现格式转换
        return video_path

    def _sanitize_filename(self, filename: str) -> str:
        """清理文件名"""
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, '_')

        if len(filename) > 200:
            filename = filename[:200]

        return filename.strip()

    async def batch_download(self, urls: list, **kwargs) -> list:
        """批量下载"""
        results = []

        for url in urls:
            try:
                result = await self.download_video(url, **kwargs)
                results.append({
                    "url": url,
                    "success": True,
                    "data": result
                })
            except Exception as e:
                logger.error(f"下载失败 {url}: {str(e)}")
                results.append({
                    "url": url,
                    "success": False,
                    "error": str(e)
                })

        return results
