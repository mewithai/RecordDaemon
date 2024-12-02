---
last_modified_at: 2024-03-24 17:00:00 
excerpt: "CrewAI에서 Agent간의 데이터 교환"
toc: true
toc_sticky: true
toc_label: "CrewAI 데이터 전송"
categories:
  - langchain
tags:
  - 자동화Bot
  - langchain
---

## 배경과 목표

Agent가 사용한 Tool의 결과가 다음 Agent로 넘어가지 않는다.

### 목표

- Tool의 사용을 명확하게 정리하고 Agent로 넘어가는 것을 확인하자.

## 이슈사항

### Final Result에 News list가 없다

Naver News Agent가 tool을 사용했음에도 Final Result에는 결과가 없다.

```
> Entering new CrewAgentExecutor chain...
I should use the get News from naver tool to search for "병원" and get a list of news related to it.

Action: get News from naver
Action Input: {"keyword": "병원", "num_news": 10}

News about 병원 are [ 따라라라라라라라라 ].

Final Answer: A list of news related to 병원, including title, link, and description.

> Finished chain.
```

`News about 병원 are ~~~`는 `NaverNewsTool`의 Class에서 Tool에 대한 사용 결과로 나온 것이다.

```python
class NaverNewsTool():
    @tool("get News from naver")
    def get_News_for_keyword(keyword : str, count : int ) -> list:
        """Useful tool for getting a list of news
           Search for a given keyword and get a given number of news

           :input value: keyword, What to search for
           :input value: count, How man news to get (default 10)
           :return value: list of tuple, (Title, Link, Description)
           """
        try:
            nn = NaverNews()
            result = nn.search_news(keyword)

            return f"News about {keyword} are {result}."
        except Exception as e:
            #explain error
            logger.error("Error occurred: %s", str(e))

            return "Error with the input for the tool."
```

그러니까 Tool을 써서 결과를 받았는데 Agent는 여기에서 사용하지 않은 것으로 보인다.

이러면 안되지!

### 수정

안정화를 위해서 다음의 것들을 수정하였다.

- `Description`의 제거
  - Naver API에서 온 것인데, 본문을 볼것이기에 제목과 링크만 있어도 충분하다
  - LLM으로 전체가 다 넘어가면 불필요하게 Tokens만 소비된다.
- Return Type의 명확화
  - Retrun의 Tuple로 되어 있는데 Dictionary가 맞다. 아니 `List of Dictionary`이다.
  
```python
class NaverNewsTool():
    @tool("get News from naver")
    def get_News_for_keyword(keyword : str ) ->  List[Dict]:
        """Useful tool for getting a list of news
           Search for a given keyword and get a given number of news

           :input value: keyword, What to search for
           :return value: list of dictionary, {Title, Link}
           """
        try:
            nn = NaverNews()
            result = nn.search_news(keyword)

            return f"News about {keyword} are {result}."
        except Exception as e:
            #explain error
            logger.error("Error occurred: %s", str(e))

            return "Error with the input for the tool."
```

## 수정사항 시험

Final Answer이 바뀐 것을 확인하자.

```
News about 병원 are [{'link': 'https://www.mk.co.kr/article/10972899', 'title': '봄과 함께 찾아온 뇌염 모기'}, {'link': 'https://www.mk.co.kr/article/10972892', 'title': '울산서 크레인 무너져 바다에 추락…작업자 2명 사망'}, {'link': 'https://www.mk.co.kr/article/10972854', 'title': '김승현♥장정윤, 시험관 임신 성공 “실감 안 나… 너무 기쁘다” (‘위대한 탄생’)'}, {'link': 'https://www.mk.co.kr/article/10972835', 'title': '“삶의 질 수직상승 책임지겠다”···민주당, 총선공약집 공개'}, {'link': 'https://www.mk.co.kr/article/10972711', 'title': '대통령실 “26일 전공의 면허정지 절차대로 진행”...강경 기조 재확인'}, {'link': 'https://www.mk.co.kr/article/10969786', 'title': '하루종일 눈 알 빠질 것 같다는 이 차장, 두통까지 호소한 이유가 [생활 속 건강 Talk]'}, {'link': 'https://www.mk.co.kr/article/10972630', 'title': '친아버지가 사촌형이 된 회장님…울산 기부 ‘부자’ 가족사 [방방콕콕]'}, {'link': 'https://www.mk.co.kr/article/10972622', 'title': '업 쌓는 직업 변호사·기자, 덕 쌓는 직업 의사 [노원명 에세이]'}, {'link': 'https://www.mk.co.kr/article/10970556', 'title': '“네가 의사다” 의학계도 환호?…만병통치약으로 대접받은 이유보니 [김기정의 와인클럽]'}, {'link': 'https://www.mk.co.kr/article/10972605', 'title': '“임플란트 치료 다시 해”…치과의사 흉기 공격한 환자, 집유 감형 왜'}, {'link': 'https://www.mk.co.kr/article/10972596', 'title': '김남주, 김강우 불륜 상대=임세미 알았다 ‘충격’ (‘원더풀 월드’)'}, {'link': 'https://www.mk.co.kr/article/10972563', 'title': '“네가 옆에 있길 바랐다”… 김수현·김지원, 눈물 속 뜨거운 키스(‘눈물의 여왕’)[종합]'}].

Final Answer: [{'link': 'https://www.mk.co.kr/article/10972899', 'title': '봄과 함께 찾아온 뇌염 모기'}, {'link': 'https://www.mk.co.kr/article/10972892', 'title': '울산서 크레인 무너져 바다에 추락…작업자 2명 사망'}, {'link': 'https://www.mk.co.kr/article/10972854', 'title': '김승현♥장정윤, 시험관 임신 성공 “실감 안 나… 너무 기쁘다” (‘위대한 탄생’)'}, {'link': 'https://www.mk.co.kr/article/10972835', 'title': '“삶의 질 수직상승 책임지겠다”···민주당, 총선공약집 공개'}, {'link': 'https://www.mk.co.kr/article/10972711', 'title': '대통

> Finished chain.
```

되긴 되네.

### 새로운 문제 : 대통!

 위 결과에서 보면 Full Search결과가 넘어가지 않고 중간에 잘리는 것을 볼 수 있다. `대통`에서 잘리고 이건 매번 동일하다. LangSmith에서 확인해봐도 실제 OpenAI로 넘어가는 Prompt가 잘리는 것을 확인할 수 있다.

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240324175846.png)

GPT3.5에 대한 이슈일 수도 있는데 Tokens 수를 세어보면 다음과 같다. 실제 CrewAI 기본 System prompt가 상당히 길기 때문에 조금만 써도 2400 Character는 넘어가는 듯 하다. 다행히 [공식문서](https://platform.openai.com/docs/models/gpt-3-5-turbo)에서 나오는 GPT3.5-turbo에 나오는 Context Windows는 16,385 tokens이다.

불행하게도 CrewAI의 기본 Model은 비싼 GPT4이다. 나의 가난에 슬퍼하자.

![]({{ site.url }}{{ site.baseurl }}/assets/images/20240324180210.png)

## 결론 및 Next Step

- Agent가 Tool의 결과를 반영하는 것은 해결하였다.
- 결과가 Full로 다음 Chain으로 넘어가지는 못했다.

### Next Step

- 결과 잘림을 해결하자.