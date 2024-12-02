---
title: "Agent의 Tokens 절약을 위한 Database 사용"
excerpt: "Next Chain으로 Database row ID만 넘겨보자."
toc: true
toc_sticky: true
toc_label: "목차"
categories:
  - langchain
tags:
  - 자동화Bot
  - AI Agent
permalink: /langchain/Using_database_to_save_tokens_in_Agent/
---

## 배경과 목표

  CrewAI Framework를 이용하여 News 분석 Agents를 만들고 있다.
 News를 수집하고 LLM으로 분석하고 결과를 보여주는 것인데, 아래 처럼 총 4개의 AI Agent를 만들고 Task를 주었다. 

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240325145846.png)

 각 Agent로 Data를 넘길때 News의 내용이 포함된 `LIST` 형태로 넘겨주고 있는데, 이것들이 모두 LLM으로 전달되기 때문에 많은 `Token`이 소모되는 문제점이 있다. 이를 해결하기 위해서 Agent에 Database를 연동하고 News가 수집된 Row의 ID만 넘겨주는 방식으로 Token을 절약해 보고자한다.

아래는 내용이 너무 길어 OpenAI에서 정상적으로 처리되지 못하고 TimeOut이 발생한 사례이다. 

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240401111433.png)

### 목표

- LangChain Agent Tool에 DB를 연동하고 Tools를 구동시켜 보자.

## DB 연동

 News 데이터는 검색을 할 필요가 없다. 따라서 `Embedding`을 하지 않았다. 또한 Agent Tool이 직접 SQL을 작성하여 DB를 조작할 경우 오류의 발생빈도가 높아질 것 같아 DB를 조회하는 Class를 따로 만들었다. 마지막으로 그냥 Text나 JSON으로 하지 않고 DB를 쓰는 이유는 나중에 관리를 쉽게할 목적이고, 어떤 결과를 얻었는지에 대해서 분석할 목적이다.

DB는 NO를 Auto Increment로 잡고 Primary Key로 사용하였다.

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240409090113.png)

 각 Agent로 Data를 넘길때 `NO`의 List만 넘기면 Agent들이 News를 꺼내서 쓰고 Update하도록 DB Class를 만들어 넣었다. Method만 쓰면 다음과 같다. Coding은 `CoPilot`이 알아서 해줬다.

```python
class SlDbEngine:
    def mysqlconnect(self, server):
      # DB접속
    def inputNews(self, link, title):
      # News 넣기
    def getNews(self, id):
      # return (link, title)
    def updateSummaryInsight(self, id ,summary, insight):
      # Summary 
```

다음 Agent로 Data를 넘겨줄때 `List[int]`를 주게 되는데 `int`는 Table에 있는 `ID`에 해당된다. Table에 Row를 Insert하고 바로 직전에 Insert된 애의 ID를 얻을 수 있는데 그 애가 바로 `lastrowid`이다. `cursor`에서 바로 불러서 썼고 이것으로 `List[int]`를 만들었다.

```python
        cur.execute(sql, (link, title))
        insertid = cur.lastrowid
```

## Custom Tool 수정

기존의 Tool을 수정해야했다. 각 Agent들의 Task들도 수정이 필요했다. 수정된 방식은 Summary와 Insight들이 얻어지면 그 결과는 Database에 Update되니까 실제로 Agent가 내용을 알 수는 없고 완료된 News의 ID만 얻을 수 있다. 이 경우 Task에서 Summary를 하라고 하니까 계속 자기가 볼땐 Summary된 정보가 없으니까 계속 Task가 완료되지 않았다고 생각하고 Tools을 호출하는 문제점이 있었다.

아래는 수정된 Tools이다. 입출력 파라미터를 중심으로 보자. 

- NaverNewsTool

```python
class NaverNewsTool():
    @tool("getNewsFromNaver")  # name of tool
    def get_News_for_keyword(keyword : str) ->  List[id]:
        """Useful Tools for searching for news with keywords,
           The input is a keyword and the output is a list of row ids in the database. 
           Agents can utilize identities to know the title and content of news.

           """
```

- NewsAnalysisTool

```python
class NewsAnalysisTool():
    @tool("AnalysisNewsList")
    def analysisNews(newsIds: List[int], story: str) -> List[int]:
        """
        Useful Tools to determined if news is relevant to a given story.
        If relevant, summarize and extract Insights at the same time.
        tool will get back an only relevant IDs that has been analyzed. 
        """
```

## 구동 결과

아래는 News를 검색하고 List를 넘기고 분석하여 DB를 업데이트 하는 데까지의 LOG이다.  

```
> Entering new CrewAgentExecutor chain...
I should use the getNewsFromNaver tool to search for news related to 하이닉스.

Action: getNewsFromNaver
Action Input: {"keyword": "하이닉스"}

ids about 하이닉스 are [51, 52, 53]. pass this list

Final Answer: [51, 52, 53]

> Finished chain.

> Entering new CrewAgentExecutor chain...

I need to use the AnalysisNewsList tool to analyze and summarize the associations between the given story and the provided IDs. If the list is empty, I can finish the task.

Action: AnalysisNewsList
Action Input: {
    "newsIds": [51, 52, 53],
    "story": "주가동향"
}

## 뉴스가 분석됨, 3개 중 1개만 출력

INFO:KTNewsAnalyst:Summary

Link: https://www.mk.co.kr/news/stock/10985520
Title: 대장株 볕 들었네 … 삼성전자 신고가 터치

Summary Title: 삼성전자와 SK하이닉스, HBM 납품 전망에 따른 주가 상승 전망
Key points: 
- 증권가는 삼성전자의 HBM 납품 전망에 따라 목표주가를 10만원 이상으로 상향 조정
- SK하이닉스도 HBM 매출이 증가할 것으로 예상되어 주가 상승 기대
Content:
- 삼성전자의 HBM 납품 전망에 따라 증권가가 목표주가를 상향 조정
- SK하이닉스도 HBM 매출이 증가할 것으로 예상되어 주가 상승이 기대됨.

Insight:
 한국의 대표적인 반도체 기업인 삼성전자와 SK하이닉스가 HBM(고대역폭 메모리) 납품 전망에 따라 증권가들이 주가 상승을 예상하고 있다. 이는 두 기업이 기술력을 바탕으로 시장에서의 경쟁력을 강화하고 수익을 높일 수 있는 좋은 기회라는 것을 시사한다. 이러한 긍정적인 전망은 주가동향에 영향을 미칠 것으로 보인다.
 

## 아래 분석이 완료되었다는 의미로 돌아온 List

[51, 52, 53]


## 여기에서 Task가 완료되지 않아서 종료하지 못하고 이상한 판단을 함, Empty List를 받으면 그냥 종료하라는 Instruction을 이해하지 못함. 바보 `GPT3.5-Trubo`!

Thought: I need to check if the list is empty or not.
Action: Check if list is empty
Action Input: {
    "list": [51, 52, 53]
} 

## 아래부터는 뻘짓

```

## 결론

내용을 DB에 넣고 Parameter를 전달하여서 Tool을 구동시켜보았다. 하지만, Agent가 Task가 완료되었음을 명확하게 인지할 수 있도록 할필요가 있다. 얘랑 일해보니까 내가 얼마나 다른 사람들에게 모호하게 일을 시켰는지 알 수 있어서 `자아 반성의 기회`가 되었다.

- 사람이나 AI이나 자기가 해야할 일을 `명!확!`하게 알려주는 것이 굉장히 중요하다.
- 내가 중요한 것이 아니라 상대가 어떻게 이해하는 지가 중요하다.

### Next Step

- `분석가 Agent`의 Task가 끝났으니 주어진 Data를 기반으로 `Report`를 만들라고 시켜보자!