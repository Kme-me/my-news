import * as vscode from 'vscode'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { NewsItem } from './newsProvider.js'

let panel: vscode.WebviewPanel | undefined

export async function openNews(item: NewsItem) {

  // 如果窗口已经存在
  if (panel) {

    panel.title = item.label
    panel.reveal()

  } else {

    panel = vscode.window.createWebviewPanel(
      'news',
      item.label,
      vscode.ViewColumn.One,
      { enableScripts: true }
    )

    panel.onDidDispose(() => {
      panel = undefined
    })

  }

  try {

    let text = item.summary

    if (!text) {

      const html = (await axios.get(item.link)).data

      const $ = cheerio.load(html)

      text = $('p')
        .map((i, el) => $(el).text())
        .get()
        .join('\n\n')

      if (!text) {
        text = $('article').text()
      }

    }

    text = text.replace(/\n{3,}/g, '\n\n')

    panel.webview.html = `
    <html>
    <body style="font-family:sans-serif;padding:20px;line-height:1.8">

    <h1>${item.label}</h1>

    ${text.split('\n\n').map(p => `<p>${p}</p>`).join('')}

    <hr>

    <a href="${item.link}">查看原文</a>

    </body>
    </html>
    `

  } catch {

    panel.webview.html = `
      <h1>${item.label}</h1>
      <p>新闻加载失败</p>
      <a href="${item.link}">${item.link}</a>
    `

  }

}