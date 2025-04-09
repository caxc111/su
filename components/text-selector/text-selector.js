Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },

  data: {
    grades: [
      { value: '1', text: '一年级' },
      { value: '2', text: '二年级' },
      { value: '3', text: '三年级' },
      { value: '4', text: '四年级' },
      { value: '5', text: '五年级' },
      { value: '6', text: '六年级' }
    ],
    semesters: [
      { value: '1', text: '上册' },
      { value: '2', text: '下册' }
    ],
    selectedGrade: null,
    selectedSemester: null,
    showTextList: false,
    presetTexts: {
      "1": {  // 一年级
        "1": [  // 上册
          {
            section: "识字 2",
            title: "金木水火 土",
            content: "一二三四五，金木水火土。天地分上下，  日月照今古。",
            unit: ""
          },
          {
            section: "识字 5",
            title: "对韵歌",
            content: "云对雨，雪对风。花对树，鸟对虫。山清对水秀，柳绿对桃红。",
            unit: ""
          },
          {
            section: "语文园地一",
            title: "咏鹅(唐 · 骆宾王)",
            content: "鹅，鹅，鹅，曲项向天歌。白毛浮绿水，红掌拨清波。",
            unit: ""
          },
          {
            section: "课文 1",
            title: "秋天",
            content: "天气凉了，树叶黄了，一片片叶子从树上落下来。天空那么蓝，那么高。一群大雁往南飞，一会儿排成 个\"人\"字，一会儿排成个\"一\"字。啊！秋天来了！",
            unit: ""
          },
          {
            section: "课文 2",
            title: "小小的船",
            content: "弯弯的月儿小小的船，小小的船儿两头尖。我在小小的船里坐，只看见闪闪的星星蓝蓝的天。",
            unit: ""
          },
          {
            section: "课文 3",
            title: "江南(汉乐府)",
            content: "江南可采莲，莲叶何田田。鱼戏莲叶间 。鱼戏莲叶东，鱼戏莲叶西，鱼戏莲叶南，鱼戏莲叶北。",
            unit: ""
          },
          {
            section: "课文 4",
            title: "四季",
            content: "草芽尖尖，他对小鸟说：\"我是春天。\"荷叶圆圆，他对青蛙说：\"我是夏天。\"谷穗弯弯，他鞠着躬说：\"我是秋天。\"雪人大肚子一挺，他顽皮地说：\"我就是冬天。\"",
            unit: ""
          },
          {
            section: "语文园地四",
            title: "惜时",
            content: "一年之计在于春，一 日之计在于晨。 一寸光阴一寸金，寸金难买寸光阴。",
            unit: ""
          },
          {
            section: "识字  6",
            title: "画",
            content: "远看山有色，近听水无声。春去花还在，人来鸟不惊。",
            unit: ""
          },
          {
            section: "识字 7",
            title: "大小多少",
            content: "一个大，一个小，一头黄牛一只猫。 一边多，一边少，一群鸭子一只鸟。 一个大，一个小，一个苹果一颗枣。 一边多，一边少，一堆杏子一个桃。",
            unit: ""
          },
          {
            section: "识字 9",
            title: "日月明",
            content: "日月明， 田力男 。小大尖，小土尘。二人从，三人众 。双木林，三木森。一人不成众，独木不成林 。众人一条心，黄土变成金。",
            unit: ""
          },
          {
            section: "识字 10",
            title: "升国旗",
            content: "中国国旗   五星红旗五星红旗，我们的国旗 。 国歌声中，徐徐升起。 迎风飘扬，多么美丽。 向着国旗，我们立正。望着国旗，我们敬礼。",
            unit: ""
          },
          {
            section: "语文园地五",
            title: "悯农(唐 · 李绅)",
            content: "锄禾日当午，汗滴禾下土。谁知盘中餐，粒粒皆辛苦。",
            unit: ""
          },
          {
            section: "课文 6",
            title: "比尾巴",
            content: "谁的尾巴长？ 谁的尾巴短？ 谁的尾巴好像一把伞？猴子的尾巴长。兔子的尾巴短。松鼠的尾巴好像一把伞。 谁的尾巴弯？谁的尾巴扁？谁的尾巴最好看？公鸡的尾巴弯 。鸭子的尾巴扁 。孔雀的尾巴最好看。",
            unit: ""
          },
          {
            section: "语文园地六",
            title: "前后左右 东西南北",
            content: "早晨起来，面向太阳。前面是东，后面是西。左面是北，右面是南。",
            unit: ""
          },
          {
            section: "语文园地六",
            title: "古朗月行(节选)唐.李白",
            content: "小时不识月，呼作白玉盘。又疑瑶台镜，飞在青云端。",
            unit: ""
          },
          {
            section: "语文园地七",
            title: "谚语",
            content: "种瓜得瓜，种豆得豆。前人栽树，后人乘凉。 千里之行，始于足下。百尺竿头，更进一步。",
            unit: ""
          },
          {
            section: "课文 12",
            title: "雪地里的 小画家",
            content: "下雪啦，下雪啦！ 雪地里来了一群小画家。小鸡画竹叶，小狗画梅花，小鸭画枫叶，小马画月牙。 不用颜料不用笔，几步就成一幅画。青蛙为什么没参加？他在洞里睡着啦。",
            unit: ""
          },
          {
            section: "语文园地八",
            title: "风 (唐 · 李峤)",
            content: "解落三秋叶，能开二月花。过江千尺浪，入竹万竿斜。",
            unit: ""
          }
        ]
      },
      "2": {  // 二年级
        "2": [  // 下册
          {
            section: "课文1",
            title: "村居[清]高鼎",
            content: "草长莺飞二月天，拂堤杨柳醉春烟。儿童散学归来早，忙趁东风放纸鸢。",
            unit: ""
          },
          {
            section: "课文1",
            title: "咏柳[唐]贺知章",
            content: "碧玉妆成一树高，万条垂下绿丝绦。不知细叶谁裁出，二月春风似剪刀。",
            unit: ""
          },
          {
            section: "语文园地（一）",
            title: "赋得古原草送别(节选)[唐]白居易",
            content: "离离原上草，一岁一枯荣。野火烧不尽，春风吹又生。",
            unit: ""
          },
          {
            section: "语文园地（二）",
            title: "关爱他人的谚语",
            content: "予人玫瑰，手有余香。平时肯帮人，急时有人帮。与其锦上添花，不如雪中送炭。",
            unit: ""
          },
          {
            section: "识字2",
            title: "传统节日",
            content: "春节到，人欢笑，贴窗花，放鞭炮。 元宵节，看花灯，大街小巷人如潮。 清明节，雨纷纷，先人墓前去祭扫。 过端午，赛龙舟，粽香艾香满堂飘。 七月七，来乞巧，牛郎织女会鹊桥。 过中秋，吃月饼，十五圆月当空照。 重阳节，要敬老，踏秋赏菊去登高。转眼又是新春到，全家团圆真热闹。",
            unit: ""
          },
          {
            section: "语文园地三",
            title: "十二生肖",
            content: "子鼠 丑牛 寅虎 卯兔 辰龙 巳蛇午马 未羊 申猴 酉鸡 戌狗 亥猪",
            unit: ""
          },
          {
            section: "语文园地四",
            title: "与诚信有关的格言",
            content: "失信不立。 诚信者，天下之结也。小信成则大信立。",
            unit: ""
          },
          {
            section: "语文园地五",
            title: "弟子规",
            content: "冠必正，纽必结，袜与履，俱紧切。置冠服，有定位，勿乱顿，致污秽。唯德学，唯才艺，不如人，当自砺。若衣服，若饮食，不如人，勿生戚。",
            unit: ""
          },
          {
            section: "课文15",
            title: "晓出净慈寺送林子方[宋]杨万里",
            content: "毕竟西湖六月中，风光不与四时同。接天莲叶无穷碧，映日荷花别样红。",
            unit: ""
          },
          {
            section: "课文15",
            title: "绝句[唐]杜甫",
            content: "两个黄鹂鸣翠柳， 一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。",
            unit: ""
          },
          {
            section: "课文16",
            title: "雷雨",
            content: "满天的乌云，黑沉沉地压下来。树上的叶子一动不动，蝉一声也不出。忽然一阵大风，吹得树枝乱摆。 一只蜘蛛从网上垂下来，逃走了。闪电越来越亮，雷声越来越响。哗，哗，哗，雨下起来了。雨越下越大。往窗外望去，树啊，房子啊，都看不清了。渐渐地，渐渐地，雷声小了，雨声也小了。天亮起来了。打开窗户，清新的空气迎面扑来。雨停了。太阳出来了。 一条彩虹挂在天 空。蝉叫了。蜘蛛又坐在网上。池塘里水满了，青蛙也叫起来了。",
            unit: ""
          },
          {
            section: "语文园地六",
            title: "悯农[唐]李绅",
            content: "春种一粒粟，秋收万颗子。四海无闲田，农夫犹饿死。",
            unit: ""
          },
          {
            section: "语文园地七",
            title: "二十四节气歌",
            content: "春雨惊春清谷天，夏满芒夏暑相连。秋处露秋寒霜降，冬雪雪冬小大寒。",
            unit: ""
          },
          {
            section: "语文园地八",
            title: "舟夜书所见[清]查慎行",
            content: "月黑见渔灯，孤光一点萤。微微风簇浪，散作满河星。",
            unit: ""
          }
        ]
      }
    }
  },

  methods: {
    // 选择年级
    selectGrade(e) {
      const grade = e.currentTarget.dataset.grade;
      this.setData({
        selectedGrade: grade
      });
    },

    // 选择学期
    selectSemester(e) {
      const semester = e.currentTarget.dataset.semester;
      this.setData({
        selectedSemester: semester
      });
    },

    // 确认选择
    handleConfirm() {
      const { selectedGrade, selectedSemester } = this.data;
      if (!selectedGrade || !selectedSemester) {
        wx.showToast({
          title: '请选择年级和学期',
          icon: 'none'
        });
        return;
      }

      this.setData({
        showTextList: true
      });
    },

    handleImportAll() {
      const { selectedGrade, selectedSemester, presetTexts } = this.data;
      if (!selectedGrade || !selectedSemester) {
        wx.showToast({
          title: '请选择年级和学期',
          icon: 'none'
        });
        return;
      }

      const texts = presetTexts?.[selectedGrade]?.[selectedSemester] || [];
      
      if (texts.length === 0) {
        wx.showToast({
          title: '没有可导入的文章',
          icon: 'none'
        });
        return;
      }

      wx.showModal({
        title: '批量导入',
        content: `确定要导入${texts.length}篇文章吗？`,
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('select', { texts });
            this.handleCancel();
          }
        }
      });
    },

    // 取消选择
    handleCancel() {
      this.setData({
        visible: false,
        selectedGrade: null,
        selectedSemester: null,
        showTextList: false
      });
      this.triggerEvent('cancel');
    },

    handleTextSelect(e) {
      const { text } = e.detail;
      this.triggerEvent('select', { text });
      this.handleCancel();
    },

    handleTextListCancel() {
      this.setData({
        showTextList: false
      });
    },

    // 阻止冒泡
    stopPropagation() {
      return false;
    }
  }
}); 