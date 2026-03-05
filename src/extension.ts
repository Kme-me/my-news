import * as vscode from 'vscode'
import { NewsProvider } from './newsProvider.js'
import { openNews } from './openNews.js'

export function activate(context: vscode.ExtensionContext) {

  // 创建新闻 provider
  const provider = new NewsProvider()

  // 注册左侧新闻列表
  vscode.window.registerTreeDataProvider(
    'newsList',
    provider
  )

  // 注册点击新闻命令
  context.subscriptions.push(

    vscode.commands.registerCommand(
      'news.open',
      openNews
    )

  )

  // 手动刷新命令
  context.subscriptions.push(

    vscode.commands.registerCommand(
      'news.refresh',
      () => {
        provider.refresh()
      }

    )

  )

  // 自动刷新（5分钟）
  const timer = setInterval(() => {

    provider.refresh()

  }, 5 * 60 * 1000)

  context.subscriptions.push({
    dispose() {
      clearInterval(timer)
    }
  })

}

export function deactivate() {}