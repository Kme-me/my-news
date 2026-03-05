import * as vscode from 'vscode'
import Parser from 'rss-parser'


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


// 分类节点（左侧：国际新闻 / 国内新闻 等）
class Category extends vscode.TreeItem {

  constructor(public readonly label: string) {

    super(label, vscode.TreeItemCollapsibleState.Expanded)

  }

}


export class NewsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

  private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter()

  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event

  parser = new Parser()


  // RSS 分类
  feeds: Record<string, string[]> = {

    国际新闻: [

      'http://feeds.bbci.co.uk/zhongwen/simp/rss.xml',
      'https://cn.nytimes.com/rss/nyt/World.xml'

    ],

    国内新闻: [

      'https://www.thepaper.cn/rss_newsDetail_forward_25434',
      'http://www.xinhuanet.com/politics/news_politics.xml'

    ],

    科技资讯: [

      'https://www.36kr.com/feed',
      'https://www.ifanr.com/feed'

    ],

    程序员: [
      'https://v2ex.com/index.xml',

    ]

  }


  // 手动刷新
  refresh(): void {

    this._onDidChangeTreeData.fire()

  }


  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {

    return element

  }


  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {

    // 第一层：分类
    if (!element) {

      return Object.keys(this.feeds).map(
        name => new Category(name)
      )

    }

    const category = element.label as string

    const urls = this.feeds[category]

    if (!urls) return []

    const items: NewsItem[] = []


    // 并发请求 RSS（优化速度）
    const feeds = await Promise.all(

      urls.map(async (url) => {

        try {

          const feed = await this.parser.parseURL(url)

          return feed.items.slice(0, 10).map(item => {

            // 尝试获取摘要
            const summary =
              item.contentSnippet ??
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


    // 展平数组
    feeds.forEach(f => items.push(...f))

    return items

  }

}