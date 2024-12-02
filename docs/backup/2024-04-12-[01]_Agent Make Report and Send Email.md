---
title: "AI Agent에게 Markdown Report를 쓰고 Mail로 쏴보자."
excerpt: "Make report and send Email"
toc: true
toc_sticky: true
toc_label: "목차"
categories:
  - langchain
tags:
  - 자동화Bot
  - AI Agent
permalink: /langchain/Write a Markdown Report to an AI Agent and shoot it to Mail/
---

## 배경과 목표

 News 분석 목적으로 Agent 4마리를 만들었다. 그 중에 3번 ReportMaker과 4번 Repoter Agent를 구현해보자.

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240325145846.png)

### 목표

- 일하는 녀석들 !

## 구현

먼저 Report는 Markdown Syntax를 사용해서 만들었다. Markdown은 내 인생 Format이다.

### ReportMarker Agent

Tool은 쉽다. DB에서 내용을 내려받아서 `Markdown File`로 쓰고 File명을 Return 받는다. 코딩은 CoPilot이 휘리릭 만들어줬다. 난 시켰을 뿐. 나는 개발자가 아니다!

```python
## Tool
class ReportMakerTool():
    @tool("ReportFileMaker")
    def MakeReportFile(newsIds: List[int]) -> str:
        """
        Useful Tools to Report News. Getting List of ids and merge conntents and return file name
        
        """
        newsReprter = NewsRepoter()
        contents = newsReprter.mergeContents(newsIds)
        file = newsReprter.WriteFile(contents, newsIds)
        return file

class NewsRepoter():
    
        def __init__(self):
            self.db = SlDbEngine()
    
        def WriteFile(self, contents, newsIds: List[int]):
            # Writefile, filename should like "2024-04-11 어쩌구저쩌구", chagne data to code
            date_str = datetime.date.today().strftime("%Y-%m-%d")
            str_lst = str(max(newsIds))

            current_dir = os.path.dirname(os.path.realpath(__file__))
            file = os.path.join(current_dir, f"./Report/{date_str}_{str_lst}.md")
            with open(file, "w") as f:
                f.write(contents)
            
            return file

        def mergeContents(self, newsIds: List[int]) -> str:
            contents = ""
            for n in newsIds:
                link, title, summary, insight = self.db.getAllResult(n)
    
                content = f"""

## {title} [원문보기]({link})

{summary}
{insight}
"""
                contents += content
            return contents
```

만들어진 결과는 다음과 같다. 샘플임.

```text
## [포토] 삼성전자 상업용 디스플레이 15년 연속 1위 [원문보기](https://www.mk.co.kr/news/business/10988089)

- 한줄요약: 삼성전자, 15년 연속 글로벌 상업용 디스플레이 시장 1위
- 핵심내용
  - 2009년 이후 15년 연속으로 삼성전자가 글로벌 상업용 디스플레이 시장에서 1위를 차지했다.
  - 현재 삼성전자는 최신 상업용 디스플레이 제품을 소개하고 있다.
  - 삼성전자 모델들이 시장에서 높은 인기를 누리고 있다.

- 인사이트
  - 삼성전자는 꾸준한 인기와 혁신적인 제품 라인업으로 글로벌 상업용 디스플레이 시장을 석권했다.
  - 연이어 15년 동안 1위를 지켜오며 삼성전자의 기술력과 경쟁력을 확인할 수 있다.
  - 최신 제품 소개로 미래에도 글로벌 시장을 선도할 것으로 기대된다.
```

### Reporter Agent

리포터는 Gmail을 이용하였다. SMTP 프로토콜은 보안 이슈로 없어지는 것 같아서 GMail API를 사용하여서 구현하였고, Google Console에서 `credentials.json`를 내려받고 1회 `tokens`를 생성하여 재인증을 하지 않도록 하였다. 예전에 찾아보고 구현하려면 정말 오래걸렸을 것 같은 이 일이 CoPilot과 ChatGPT를 통해서 1분안에 구현되었다. 대박!

혹시, Code가 필요한 분은 그냥 ChatGPT에게 물어보자. 내 Code보다 훨신 낫다!

```python
## Tool
class ReportTool():
    @tool("Reporter")
    def SendReport(filename: str):
        """
        Useful Tools to send Report to Email. Getting File name and send it to Email
        
        """

        gmail = GmailWrapper()
        gmail.sendMarkdownEmail("NO_SPAM_PROTECT@gmail.com", "블라블라제목", filename)
        return "Finished Sending Report"
```

`Markdown`을 `HTML` 형태로 변환하여 이메일 본문으로 붙이는데, `markdown moudule`을 활용할 수 있다. 하지만, 이상하게 `Nested List`가 지원되지 않았고, ChatGPT의 조언에 따라 `mistune`을 사용하였다. 다음부터는 처음부터 `mistune`을 사용하자.

```
It seems like the Python `markdown` library is not correctly parsing the nested list. This could be due to a bug or limitation in the library.

As an alternative, you can use the `mistune` library, which is another Markdown parser in Python that supports nested lists. Here's how you can modify your code to use `mistune`:
```

mistune은 다음과 같이 쓰면 된다.

```python
import mistune

# Create a Markdown renderer
markdown = mistune.create_markdown()

# Convert Markdown to HTML
html_content = markdown(md_with_css)
```

## 결론 및 Next Step

`Keyword 검색` -> `Garbage선별` -> `내용 요약` -> `인사이트 도출` -> `리포트 생성` -> `리포트 발송`의 모든 과정 AI Agent에 의해서 행해지도록 구현해 보았다. Tokens 절약을 위해서 Database에 저장하였고 이슈 없이 사용하고 있다. 이메일로 수신된 내용은 다음과 같다.

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240412101729.png)

### 배운 점

- LangChain Agent의 CustomTool에 대해서 이해할 수 있었다.
- Pydantic에 대한 이해를 기반으로 CustomTool의 Input/Output format에 대해서 이해하였다.
- ChatGPT3.5, ChatGPT4를 사용해보면서 ChatGPT4가 성능은 좋지만 더럽게 비싸다는 것을 알았다. 결국 성능 좋은 AI를 가진사람이 승자가 될 것이다.
- CrewAI Framework에서 Role, Task 등을 직접 적용해보면서 동작 메커니즘을 이해 할 수 있었다.

### Next Step

- `Investing.com`의 Article을 긁어서 DB로 쌓고 분석시켜보자.
- LLM의 추론(Reasoning + Act) 능력을 좀 더 잘 활용할 수 있는 방법을 생각해보자.
- AI 녀석들이 나를 뛰어 넘을 것 같다. 반도체 주식에 더 투자하자.
