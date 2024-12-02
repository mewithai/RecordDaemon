---
excerpt: "네이버에서 제공한 News를 요약하는 Agent의 문제점 "
toc: true
toc_sticky: true
toc_label: "News Agent Garbage Data"
categories:
  - langchain
tags:
  - 자동화Bot
  - langchain
---

## 배경과 목표

네이버 News API를 사용해서 얻은 News를 요약하는데서 생기는 문제점에 대해서 고민해보자.

목표: Contaminated된 정보를 발라낼 방법을 고민하다.

## 문제점 제기

네이버 News API를 통해서 `Link`를 얻고 이것을 통해서 News의 내용을 LangChain을 이용해서 Load, 그리고 요약해보았다.

그런데, 막상 실행하니까 기사 원문 외에 주위에 있는 다수의 글자들이 원문과 섞이면서 내용을 이해하기 힘들게 만들었다. 

### Code

아래는 LLM을 통해서 요약하기 위한 Method이다.

```python

    def ReadNews(self, url):

        # 뉴스기사의 본문을 Chunk 단위로 쪼개기 위한 splitter
        text_splitter = CharacterTextSplitter(        
            separator="\n\n",
            chunk_size=3000,     # 쪼개는 글자수
            chunk_overlap=300,   # 오버랩 글자수
            length_function=len,
            is_separator_regex=False,
        )

        loader = AsyncChromiumLoader([url])
        contents = loader.load_and_split(text_splitter)

        # 각 Chunk 단위의 템플릿
        template = '''Summarize the following in Korean

        {text}
        '''

        # 전체 문서(혹은 전체 Chunk)에 대한 지시(instruct) 정의
        combine_template = '''{text}

        The results of the summary should be in the following format in korean
        Title: The title of the newspaper article
        Key points: a one-line summary of the article
        Content: bulleted points of the main points.
        '''

        # 템플릿 생성
        prompt = PromptTemplate(template=template, input_variables=['text'])
        combine_prompt = PromptTemplate(template=combine_template, input_variables=['text'])

        # 요약을 도와주는 load_summarize_chain
        chain = load_summarize_chain(self.llmLC, 
                             map_prompt=prompt, 
                             combine_prompt=combine_prompt, 
                             chain_type="map_reduce", 
                             verbose=False)

        chain.run(contents)
```

 위 코드는 다음의 Site에서 참고하였다. : [Link](https://teddylee777.github.io/langchain/langchain-tutorial-05/)

- 기사의 내용이 너무 길기 때문에 `Loader`로 받은 내용을 글자수 단위로 쪼개서 `Documents`로 만든다.
  - 여기에서 `News Contents`외에 다수의 내용이 포함되어 버린다.
  - 이것 때문에 전체 요약이 이상하게 나오게 된다.
  
### 분석

시험 URL로 [이투데이-뉴욕증사관련 News](https://www.etoday.co.kr/news/view/2343297)을 Loading하였다.

Webloader는 다음 input_documents를 체인으로 넘겨서 마지막 Output_text를 얻었다. 답이 영 이상하다.

두번째 Document 에서 원래의 내용인 `뉴욕증시`와는 전혀 관계없는 연예인 관련 뉴스가 들어갔다. Contaminated된 것이다.

```python
{'input_documents': 
  [
    Document(page_content="[상보] 뉴욕증시, 고점 인식 속 혼조…나스닥은 또 사상 최고치 - 이투데이\n\n\n이투데이\n\n글로벌경제\...들이 대화하고 있다. 뉴욕(미국)...', 'language': 'ko'}), 
    Document(page_content='댓글\n\n0 / 300\n\ne스튜디오\n\n\n[ENG/SUB] ‘더보이즈(THE BOYZ)’, 치명적인 판...들이 대화하고 있다. 뉴욕(미국)...', 'language': 'ko'})
  ],
  'output_text': '제목: 더보이즈, 판타지 콘셉트로 선두 가능성\n\n주요 내용:\n- 더보이즈의 판타지 콘셉트에 대한 기사\n- 그룹이 선두가 될 수 있는 가능성에 대한 논의\n- 다양한 주제의 기사들이 포함된 e스튜디오에서 발행된 기사들'}
```

좀 더 자세하기 보기 위해서 첫번째 Document의 page_content이다. 첫번째부터 내용이 뉴욕과 무관한 것들이 들어간 것을 볼 수 있다. 

```
"[상보] 뉴욕증시, 고점 인식 속 혼조…나스닥은 또 사상 최고치 - 이투데이\n\n\n이투데이\n\n글로벌경제\n\n국제시황\n\n[상보] 뉴욕증시, 고점 인식 속 혼조…나스닥은 또 사상 최고치\n입력 2024-03-23 06:42\n\n\r\n                                             고대영 기자                                            \nkodae0@etoday.co.kr\n\n\nURL공유\n\n카카오톡\n\n페이스북\n\nX(트위터)\n\n\n작게보기\n\n기본크기\n\n크게보기\n\n\n한 주간 3대 지수 모두 2%대 강세연준 ‘3회 인하’ 재확인 효과▲뉴욕증권거래소(NYSE)에서 20일(현지시간) 트레이더들이 대화하고 있다. 뉴욕(미국)/로이터연합뉴스뉴욕증시는 고점 인식 속에 혼조 마감했다.22일(현지시간) 뉴욕증권거래소(NYSE)에서 다우지수는 전 거래일 대비 305.47포인트(0.77%) 하락한 3만9475.90에 마감했다. S&P500지수는 7.35포인트(0.14%) 내린 5234.18에, 기술주 중심의 나스닥지수는 26.98포인트(0.16%) 상승한 1만6428.82에 거래를 마쳤다.주요 종목으로는 마이크로소프트(MS)가 0.15% 하락했고 테슬라는 1.15% 내렸다. 반면 알파벳은 2.04%, 애플은 0.53% 상승했다. 또 엔비디아는 3.12%, 아마존은 0.4% 올랐다.한 주간 다우지수는 약 2% 상승했고 S&P500지수와 나스닥지수는 각각 2.3%, 2.9% 올랐다. 이날은 주가가 지나치게 높아졌다는 인식 속에 혼조세를 보였다. 다만 나스닥지수는 이날도 오르면서 사상 최고치를 경신했다.트뤼스트의 키스 러너 최고투자책임자(CIO)는 CNBC방송에 “정말 강한 한 주를 보낸 후 소화를 시키는 시간이었다”며 “전반적인 추세는 여전히 긍정적”이라고 분석했다.이번 주 시장은 미국 연방준비제도(Fed·연준)가 연내 기준금리 인하 횟수(3회)를 축소할 것이라는 우려와 달리 기존 입장을 재차 확인하자 환호했다. 연준은 연방공개시장위원회(FOMC) 정례회의 후 점도표를 통해 연말 금리 중간값을 4.6%로 제시했다. 이는 지난해 12월 점도표와 같다. 올해 남은 기간 0.75%포인트(p) 정도를 인하하겠다는 의미로, 0.25%p씩 3회 인하가 전망된다.제롬 파월 연준 의장은 기자회견에서 “인플레이션이 2%를 향해 점진적으로 하락하고 있다는 전체적인 흐름은 바뀌지 않았다”며 “강력한 고용 자체만으로 금리 인하를 연기할 이유가 되지는 않을 것”이라고 밝혔다.\n\n\n#뉴욕증시\n#나스닥\n#엔비디아\n\n관련 뉴스[종합] 뉴욕증시, '레딧' 상장 속 이틀 연속 사상 최고치…나스닥 0.20%↑[오늘의 뉴욕증시 무버] 미국 SNS 레딧, 상장 첫날 48.35%↑\n\n\n좋아요0\n화나요0\n슬퍼요0\n추가취재 원해요0\n\n\n주요뉴스\n\n\n\r\n                                                                                '여의도4PM' 구독하고 스타벅스 커피 받자!…유튜브 구독 이벤트                                        \n\n\r\n                                                                                류현진과 린가드가 붙었다…‘KBO리그 vs K리그1’ 2024 흥행 승자는? [요즘, 이거]                                        \n\n\r\n                                                                                치킨인 줄 알았는데…외국인들 ‘최애 K푸드’는 이것 [그래픽뉴스]                                        \n\n\r\n                                                                                가상자산 시장 투심 회복…‘김치프리미엄’ 상승 따라 ‘업프·빗프’도 기승                                        \n\n\n\r\n                                                                                “드디어 봄”…서울 곳곳 ‘벚꽃 축제’ 풍성                                        \n\n\r\n                                                                                러시아 모스크바 총격 참사로 최소 62명 사망…IS “우리가 했다”                                        \n\n\n단독\r\n                                                                                금감원, ‘뻥튀기 상장’ 파두 관련 한국거래소 참고인 조사                                        \n\n\r\n                                                                                영국 왕세자빈도 암 진단 받았다 '왕실 비상'                                        \n\n댓글\n\n0 / 300\n\ne스튜디오\n\n\n[ENG/SUB] ‘더보이즈(THE BOYZ)’, 치명적인 판타지 콘셉트로 ‘즈’ 그룹의 선두가 될 수 있을까? [컬처콕]\n\n\n많이 본 뉴스\n\n1.\n\r\n                                    \t\t                                    \t\t현대건설, 여의도 한양 재건축 수주…‘디에이치 여의도퍼스트’ 짓는다"
```

앞서 기술한 바와 같이 Webloader는 페이지 전체를 Loading하는데 이 안에 광고도 있고 다른 것 News도 있어서 그냥 혼돈의 도가니이다.

## 대안제시

이를 해결하기 위해서는 News Contents만 딱 주는 애가 필요하다. Naver News API를 찾아봐도 이 관련해서는 기능이 없다.

[네이버 News 검색 API 문서](https://developers.naver.com/docs/serviceapi/search/news/news.md)

### 그냥 한 곳만 찾자.

네이버 News API는 병맛이다. 이 API를 통해서 모든 언론사를 뒤지는 건 바보같은 짓이다.

그냥 YTN이나 연합 뉴스 등 유명한 곳만 정해서 그쪽의 News들만 특정 TAG를 통해서 분리해내는 것이 더 나은 선택이다.

## 결론 및 Next Step

- 네이버 뉴스 API를 버린다.
- News는 YTN이나 연합뉴스 같이 Format이 변하지 않는 것들만 사용한다.
  - Requests와 BeautifulSoup를 사용해서 TAG별로 분리한다.

### Next Step

- 연합뉴스에서 본문을 가지고 오는 LangChain Tool을 만들 것.

