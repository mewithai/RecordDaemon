---
title: "LangChain Custom Tool의 args_schema은 Nested BaseModel 지원 안한다."
last_modified_at: 2024-03-29 21:00:00 
excerpt: " Nested BaseModel을 argos_schema를 넣으면 Error가 발생하는 이유"
toc: true
toc_sticky: true
toc_label: "목차"
categories:
  - langchain
tags:
  - 자동화Bot
  - langchain
permalink: /langchain/LangChain-Tool-and-argos_schema_Nested BaseModel/
---

## 배경 및 목적

LangChain으로 Custom Toos를 만들다 보니 `argos_schema`를 넣었는데, 자꾸 LLM이 입력 파라미터가 Dict가 아니라고 한다. 왜 그런지 알아보자.

### 목표

- 왜 에러가 발생하는지 이해하기
- `argos_schema`와 `Nested BaseModel`을 피하가는 방법 알아내기

## 현상

아래는 시험삼아 만들고 있는 뉴스 분석기인데, 보면 `AnalysisNewsList` 툴이 동작하지 못하고 에러가 발생한다. tool에 입력값은 원하는 데로 들어갔다는 것 까지는 알겠다.

```
Action: AnalysisNewsList
Action Input: {"news": [News(Link='https://www.mk.co.kr/news/economy/10950397', Title='요양병원 경제효과 36조 …전문화 시급')], "story": 'ICT'}

Final Answer: Error: the Action Input is not a valid key, value dictionary.
```

### 원인

`LangSmith`로 분석해보니 Prompt에 Tool에 대한 설명이 원하는 바와 다르게 들어가 있는 것을 확인하였다.

```
You ONLY have access to the following tools, and should NEVER make up tools that are not listed here:

AnalysisNewsList:
  AnalysisNewsList(news: List[NewsAnalyst.News], story: str)
  ->
  List[NewsAnalyst.NewsSummary]
  
- Useful Tools to determine if news is relevant to a given story. input is a list of news and a story.
```

좀 잘 해볼려고 `Pydantic`을 써보았는데. 얘가 원인이였다. 그냥 쉽게 말해 BaseModel을 두번 계층구조로 사용하였는데,  `NewsListSearchInput` 밑에다가 `List[News]`의 `News`를 사용하였다. LangSmith의 로그에서 `List[NewsAnalyst.News]`가 지칭하는 것이 `List[News]`이다. News의 Scheme가 정상적으로 변환되지 않은 것이다.

```python
## Tool args_schema pydantic
class News(BaseModel):
    Link: str = Field(description='The Url that the news is located')
    Title: str = Field(description='Title of the news')

class NewsListSearchInput(BaseModel):
    news: List[News] = Field(description="List of News {Link, Title}")
    story: str = Field(description="Criteria for determining if news is relevant")

class NewsAnalysisTool():
    @tool("AnalysisNewsList", args_schema=NewsListSearchInput)
    def analysisNews(news: List[News], story: str) -> List[NewsSummary]:
        """
        Useful Tools to determine if news is relevant to a given story. input is a list of news and a story.
        """
```

### 다른 사람들은?

어렵지 않게 동일한 문제를 겪고 있는 사람들이 있었다. [langchain-ai github](https://github.com/langchain-ai/langchain/issues/9375)에서도 비슷한 질문이 올라왔다.

 `dosubot`이 확인해 준 바로는 `아직 안된다` 이다. 그리고 친절하게도 Package를 수정하여 지원할 수 있는 방법도 알려주고 있다. 

> Based on your description, it seems that the LangChain framework does not natively support nested Pydantic models in the args_schema parameter of the StructuredTool function.

## 결론

수정된 Package 코드를 받았지만, 잘못 건드리면 문제가 생길 수 있으니 그냥 `쓰지말자.` 

### 참고 Code

아래는 [공식 홈페이지](https://python.langchain.com/docs/modules/agents/tools/custom_tools#tool-decorator)에 소개된 `Custom Tool` Code이다. 공홈에서도 Nested된 Parameter는 쓰고 있지 않다. 시간이 지나면 보완되겠지뭐..

```python
class SearchInput(BaseModel):
    query: str = Field(description="should be a search query")


@tool("search-tool", args_schema=SearchInput, return_direct=True)
def search(query: str) -> str:
    """Look up things online."""
    return "LangChain"
```
