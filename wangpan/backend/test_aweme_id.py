"""
测试脚本 - 验证 aweme_id 提取功能
"""
import asyncio
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

async def test_aweme_id_extraction():
    """测试 aweme_id 提取功能"""
    print("=" * 70)
    print("测试 aweme_id 提取功能")
    print("=" * 70)

    from services.douyin_service import DouyinService

    # 创建服务实例
    service = DouyinService()

    # 测试URL列表
    test_urls = [
        "https://www.douyin.com/video/7300000000000000",
        "https://www.douyin.com/video/7300000000000000?previous_page=main",
        "https://www.douyin.com/jingxuan?modal_id=7592156499439291657",  # modal_id格式
        "https://v.douyin.com/xxxxxx",  # 短链接（会失败，但测试解析逻辑）
    ]

    for i, url in enumerate(test_urls, 1):
        print(f"\n[测试 {i}] URL: {url}")
        try:
            aweme_id = await service._extract_aweme_id(url)
            if aweme_id:
                print(f"✓ 成功提取 aweme_id: {aweme_id}")
            else:
                print(f"✗ 未能提取 aweme_id")
        except Exception as e:
            print(f"✗ 提取失败: {e}")

    print("\n" + "=" * 70)
    print("支持的URL格式:")
    print("- https://www.douyin.com/video/7300000000000000")
    print("- https://www.douyin.com/video/7300000000000000?previous_page=main")
    print("- https://www.douyin.com/jingxuan?modal_id=7592156499439291657  ✓ 新增")
    print("- https://v.douyin.com/xxxxxx (短链接)")
    print("- 带有 aweme_id 或 item_ids 参数的URL")
    print("=" * 70)
    print("\n流程说明:")
    print("1. 从URL提取 aweme_id")
    print("2. 调用 fetch_one_video(aweme_id) 获取视频信息")
    print("3. 下载视频文件")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(test_aweme_id_extraction())
