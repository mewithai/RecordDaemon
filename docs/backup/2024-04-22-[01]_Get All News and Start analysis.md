---
permalink: /langchain/Gather all news and start analyzing it/
title: "News를 다모아 놓고 그리고 분석을 시작하자."
excerpt: "News 분석 시스템을 효율화해보기"
toc: true
toc_sticky: true
toc_label: "목차"
categories:
  - langchain
tags:
  - 자동화Bot
  - AI Agent
---

## 배경과 목표

News 분석을 돌려 놓고 간간히 시간이 날때마다 한번씩 읽어보고 있는데, 확실하게 요약본을 보니까 상황파악에 들어가는 시간을 줄일 수 있는 것 같다. 근데, Keyword가 많아 질 수록 효율이 떨어진다.

### 현재구조의 문제점

현재 구조는 각각의 Keyword과 Category, 그리고 Insight 추줄을 위한 Instruction이 Shell Script로 구동된다.

```
/home/JSToolsLC/bin/python /home/JSToolsLC/NewAgentMain.py "하이닉스"   "사업관련"     "투자자 관점에서 상황을 분석"
/home/JSToolsLC/bin/python /home/JSToolsLC/NewAgentMain.py "환율"       "경제관련"     "투자자 관점에서 상황을 분석"
/home/JSToolsLC/bin/python /home/JSToolsLC/NewAgentMain.py "이스라엘"   "경제관련"     "투자자 관점에서 상황을 분석"
```

한번 프로그램이 돌아갈때마다 Agent가 CrewAI를 호출하면서 Tokens을 소비하고 이렇게 할 필요가 없는데 AI Agent의 `Custom Tools`를 시험해보다 보니까 비효율적으로 만들어진 것 같다.

### 개선

일단, Python으로 Keyword로 모든 News의 URL을 수집하고 그리고 AI Agent에게 분석을 시키자. 수집은 LLM의 개입이 없기 때문에 Tokens도 절약되고 뭐 막 수집해도 될 듯하다.

![]({{ site.url }}{{ site.baseurl }}/assets/images/images/20240325145846.png)

### 목표

- News를 수집해서 DB로만 때려박는 Python Code

## 구현

- 이미 `Agent`에 `Custom Tool`로 구현된 것을 그대로 main에서 불러다 쓰면 된다. Agent가 Tool을 불러서 쓰라고 만들어서 그런지 활용도가 높다.

```python
import sys

if __name__ == "__main__":
    if len(sys.argv) > 1:
        group = sys.argv[1]
    else:
        print("Please provide group name to get keyword")
        sys.exit(1)

    # get keyword using group from SNGDB
    
    nn = NaverNews()
    keyword = nn.db.getKeyword(group)

    for ky in keyword:
        result = nn.search_news(ky[0])
        print(result)     
```

Keyword를 Argument로 받는 Shell을 만들어서 1시간에 1번씩 Crontab 작업으로 돌렸다. Keyword는 관리를 위해서 Database로 구성하였고 구분자(Group)를 두어서 여러가지 Project에 활용가능 하도록하였다.

Coding은 CoPilot에게 Mission을 주었고 1분이 걸리지 않았다. 코딩 공부를 할 시간에 CoPilot이랑 진솔한 대화를 나누기 위해서 영어를 공부하는 것이 나을 듯하다. 

## 결과 및 Next Step

잘 돌아간다.

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240424053129.png)

### Next Step

- Docker Container가 시작하면 `cron`과 같은 서비스들이 자동 실행이 되지 않는데 해결 방안 필요
- Agent와 무관하게 수집된 News를 LLM으로 요약하고 Insight를 뽑는 프로그램 작성
  - Agent는 한번 만들어 봤고 이해를 하였으니, 이제 Job을 단순화 할 것
