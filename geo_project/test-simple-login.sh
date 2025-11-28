#!/bin/bash
echo "========================================"
echo "GEO平台登录流程测试 - 直接跳转登录页"
echo "========================================"
echo

echo "✅ 简化后的登录流程："
echo "1. 检查平台登录状态"
echo "2. 直接跳转到对应平台登录页面"
echo "3. 验证页面加载完成"
echo "4. 等待用户手动登录"
echo

echo "🔍 测试API接口："

# 测试健康检查
echo "1. 健康检查接口："
health_response=$(curl -s http://localhost:8095/api/geo/health)
echo "   $health_response"

# 测试微博平台状态
echo
echo "2. 微博平台状态检查："
status_response=$(curl -s http://localhost:8095/api/geo/platform/weibo/status)
echo "   $status_response"

# 测试登录接口（直接跳转到微博登录页）
echo
echo "3. 测试登录接口（直接跳转到微博登录页）："
login_response=$(curl -s -X POST http://localhost:8095/api/geo/platform/weibo/login)
echo "   $login_response"

# 检查返回结果
if echo "$login_response" | grep -q "success.*false"; then
    echo "   📝 登录接口返回失败（预期：Playwright未安装）"
elif echo "$login_response" | grep -q "success.*true"; then
    echo "   ✅ 登录接口返回成功"
else
    echo "   ❓ 登录接口返回异常"
fi

echo
echo "📋 各平台登录URL："
echo "- 微博: https://weibo.com/login.php"
echo "- 小红书: https://www.xiaohongshu.com/explore"
echo "- 知乎: https://www.zhihu.com/signin"
echo "- 抖音: https://www.douyin.com/passport/web/register/login/"
echo "- CSDN: https://passport.csdn.net/login?code=public"
echo "- 掘金: https://juejin.cn/login?type=login"
echo "- 简书: https://www.jianshu.com/sign_in"
echo "- 博客园: https://account.cnblogs.com/signin"
echo "- 开源中国: https://www.oschina.net/home/login"
echo "- SegmentFault: https://segmentfault.com/user/login?required=true"

echo
echo "🚀 简化后的浏览器操作流程："
echo "1. 启动浏览器 (Chromium)"
echo "2. 直接访问平台登录页面"
echo "3. 等待页面完全加载"
echo "4. 停留在登录页面等待用户操作"

echo
echo "📖 测试方法："
echo "1. 访问前端: http://localhost:3055/"
echo "2. 进入'发布管理'页面"
echo "3. 点击任意平台的'登录'按钮"
echo "4. 浏览器直接打开对应平台登录页面"
echo "5. 手动完成登录操作"

echo
echo "🔧 如果需要完整的Playwright功能："
echo "1. 运行: ./setup-playwright.bat"
echo "2. 重启后端服务"
echo "3. 重新测试登录流程"