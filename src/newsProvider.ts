import * as vscode from 'vscode'
import Parser from 'rss-parser'
import axios from 'axios'

// 单条新闻
export class NewsItem extends vscode.TreeItem {

  constructor(
    public readonly label: string,
    public readonly link: string,
    public readonly source: string,
    public readonly summary?: string
  ) {

    super(label)

    // 点击新闻执行命令
    this.command = {
      command: 'news.open',
      title: 'Open',
      arguments: [this]
    }

  }

}


// 分类节点
class Category extends vscode.TreeItem {

  constructor(public readonly label: string) {

    super(label, vscode.TreeItemCollapsibleState.Expanded)

  }

}


export class NewsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

  private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter()

  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event

  parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/rss+xml, application/xml'
    },
    timeout: 10000
  })


  constructor() {

    // 监听设置变化
    vscode.workspace.onDidChangeConfiguration(e => {

      if (e.affectsConfiguration('myNews.feeds')) {

        this.refresh()

      }

    })

  }


  // 从 VSCode 设置读取 RSS 源
  private getFeeds(): Record<string, string[]> {

    const config = vscode.workspace.getConfiguration('myNews')

    return config.get<Record<string, string[]>>('feeds') || {}

  }


  // 手动刷新
  refresh(): void {

    this._onDidChangeTreeData.fire()

  }


  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {

    return element

  }


  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {

    const feeds = this.getFeeds()

    // 第一层：分类
    if (!element) {

      return Object.keys(feeds).map(
        name => new Category(name)
      )

    }

    const category = element.label as string

    const urls = feeds[category]

    if (!urls) return []

    const items: NewsItem[] = []


    // 并发请求 RSS
    const rssFeeds = await Promise.all(

      urls.map(async (url) => {

        try{ 
          const res = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0',
              'Accept': 'application/rss+xml'
            },
            timeout: 10000
          })

          const feed = await this.parser.parseString(res.data)
          console.log(feed)
          return feed.items.slice(0, 10).map(item => {

            const summary =
              item.contentSnippet ??
              (item as any).description ??
              (item as any).content ??
              (item as any).summary ??
              ''

            return new NewsItem(

              `[${feed.title}] ${item.title ?? 'No Title'}`,
              item.link ?? '',
              feed.title ?? '',
              summary

            )

          })

        } catch (e) {

          console.log('RSS error:', url)

          return []

        }

      })

    )


    rssFeeds.forEach(f => items.push(...f))

    return items

  }

}