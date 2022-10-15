import { Title, Text, Box, Paper, Popover, createStyles, Group, ColorSwatch, SelectItem, Select, Tabs, Chip, Button, Modal, FileInput, TextInput, Stack, Checkbox, ActionIcon, ColorPicker, Tooltip, Grid, CloseButton, Accordion, Alert, Badge, Table, Menu, Progress, DefaultMantineColor, ThemeIcon, Textarea, Input, NumberInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useLocalStorage } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { IconAlertCircle, IconArrowBarToLeft, IconArrowBarToRight, IconArrowRight, IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconColorSwatch, IconDotsVertical, IconDownload, IconEdit, IconGripVertical, IconInfoCircle, IconMessageCircle, IconPhoto, IconPlus, IconRefresh, IconSortAscendingLetters, IconSortAscendingNumbers, IconSortDescendingLetters, IconSortDescendingNumbers, IconTextSpellcheck, IconTrash, IconX } from '@tabler/icons'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided } from 'react-beautiful-dnd'


interface Collection {
  name: string
  tasks: Task[]
  topics?: Topic[]
  questions?: Question[]
}

interface Topic {
  name: string
  id: number | string
  color: string
  count?: number
}

interface Sentence {
  text: string
  topic: number | string
}

interface Task {
  id: string
  title: string
  sentences: Sentence[]
  annotations?: Annotations
}

interface Annotations {
  irrelevant?: boolean,
  [key: string]: any
}

interface Question {
  text: string
  prop: string
  answers: Answer[]
  relevancy?: RelevancyTest[][]
  relevantTopics?: string[]
}

interface Answer {
  id?: string
  label: string
  value?: any
  color?: DefaultMantineColor
}

interface RelevancyTest {
  prop: string
  value?: any
}

interface ProgressSection {
  value: number
  color: DefaultMantineColor
  label: string
  tooltip: string
}

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  label: string;
  text: string;
}

type QuestionAction = "deleteAnswers" | "editQuestion" | "deleteQuestion"




const isValidSentence = (s: Sentence) => {
  const ek = Object.keys(s)
  return ek.length > 0 &&
    ek.includes("text") &&
    ek.includes("topic")
}

const isValidTask = (e: Task) => {
  const ek = Object.keys(e)
  return ek.length > 0 &&
    ek.includes("id") &&
    ek.includes("sentences") && Array.isArray(e.sentences) && e.sentences.every(isValidSentence) &&
    ek.includes("title")
}

const isValidTopic = (e: Topic) => {
  const ek = Object.keys(e)
  return ek.length > 0 && ek.includes("name")
}

const isValidQuestion = (e: Question) => {
  const ek = Object.keys(e)
  return ek.length > 0 &&
    ek.includes("text") && typeof e.text === "string" &&
    ek.includes("prop") && typeof e.prop === "string" &&
    ek.includes("answers") && Array.isArray(e.answers) && e.answers.every(isValidAnswer) &&
    (!e.relevancy || (Array.isArray(e.relevancy) && e.relevancy.every(isRelevancyAndTests)))
}

const isValidAnswer = (e: Answer) => {
  const ek = Object.keys(e)
  return ek.length > 0 &&
    ek.includes("label") && typeof e.label === "string"
}

const isRelevancyAndTests = (e: RelevancyTest[]) => {
  return !!e && Array.isArray(e) && e.every(isRelevancyOrTest)
}

const isRelevancyOrTest = (e: RelevancyTest) => {
  const ek = Object.keys(e)
  return ek.length > 0 &&
    ek.includes("prop") && typeof e.prop === "string"
}

const isValidTasks = (e: unknown) => {
  return e && Array.isArray(e) && e.length > 0 && e.every(isValidTask)
}

const isValidTopics = (e: unknown) => {
  return e && Array.isArray(e) && e.length > 0 && e.every(isValidTopic)
}

const isValidQuestions = (e: unknown) => {
  return e && Array.isArray(e) && e.length > 0 && e.every(isValidQuestion)
}

const isValidData = (e: any) => {
  if (!isValidTasks(e.tasks)) {
    return false
  }
  if (!isValidTopics(e.topics)) {
    return false
  }
  if (!isValidQuestions(e.questions)) {
    return false
  }
  return true
}


export const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const buildColor = () => {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")
}

export const getContrastColor = (color: string) => {
  const rgb = color.match(/[A-Fa-f0-9]{1,2}/g)?.map(v => parseInt(v, 16)) || []
  if (rgb.length === 3) {
    const brightness = Math.round(((rgb[0] * 299) +
      (rgb[1] * 587) +
      (rgb[2] * 114)) / 1000);
    return (brightness > 125) ? 'black' : 'white'
  }
  return 'black'
}

export function download(content: string, fileName: string, contentType: string) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

export function processFile<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.onload = event => {
      if (event.target?.result) {
        return resolve(JSON.parse(event.target.result as string) as T[]);
      }
      return reject([])
    }
    reader.readAsText(file);
  })
}

export async function importFile<T>(file: File | null, name: "tasks" | "topics" | "questions" | "combo") {
  if (file) {
    const data: T[] = await processFile(file);

    if (name === "combo") {
      if (isValidData(data)) return data
      throw "Invalid data format"
    }
    else if (data.length > 0) {
      if (name === "tasks") {
        if (isValidTasks(data)) return data
        throw "Invalid format for: documents"
      }
      if (name === "topics") {
        if (isValidTopics(data)) return data
        throw "Invalid format for: topics"
      }
      if (name === "questions") {
        if (isValidQuestions(data)) return data
        throw "Invalid format for: questions"
      }
    }
    else {
      throw "No file provided"
    }
  }
  return [] as any
}

export const topicToSelectItem = (t: Topic): SelectItem => {
  return {
    value: String(t.id),
    label: t.name
  }
}

export const testRelevancy = (q: Question, task: Task) => {
  if (!!q.relevancy && q.relevancy.length > 0 && !!task.annotations) {
    const ann = task.annotations || {}
    return q.relevancy.reduce((a, andTest) => {
      if (andTest.length > 0) {
        const success = andTest.some(orTest => {
          const v = ann[orTest.prop]
          return v === orTest.value
        })
        if (!success) {
          a.push(andTest)
        }
      }
      return a
    }, [] as RelevancyTest[][])
  }
  return []
}




const useStyle = createStyles(theme => ({
  textPreview: {
    display: "inline-block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "0.8em",
    opacity: 0.5,
    paddingBottom: 5,
    maxWidth: 300,
    borderBottom: `thin solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[5]}`
  },
  sentence: {
    color: theme.colorScheme === 'dark' ? "#ccc" : "currentcolor"
  },
  topic: {
    flex: 1,
    padding: "5px 5px 5px",
    wordWrap: "break-word",
    textOverflow: "ellipsis",
    overflow: "hidden",
    cursor: "pointer",
    minHeight: 36
  },
  highlightedText: {
    //fontWeight: 500
  },
  colorPreview: {
    height: "3em",
    width: "100%",
    marginBottom: 5,
    borderRadius: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  topicLine: {
    padding: "0 0.5em",
    "&:hover": {
      background: theme.colorScheme === 'dark' ? "black" : theme.colors.gray[1]
    }
  },
  tableRow: {
    "&:hover": {
      background: theme.colorScheme === 'dark' ? "black" : theme.colors.gray[1]
    }
  }
}))





export function AnswerItem(props: {
  answer: Answer
  value: any
  onAnswer: (value: any) => void
}) {

  return (
    <Button
      key={String(props.answer.value)}
      color={props.answer.color}
      variant={props.value === props.answer.value ? 'filled' : 'outline'}
      onClick={() => props.onAnswer(props.answer.value)}
    >
      {props.answer.label}
    </Button>
  )
}


export function QuestionItem(props: {
  question: Question
  index?: number
  answer: any
  onAnswer: (value: any) => void
  progressSections?: ProgressSection[]
  onAction?: (action: QuestionAction) => void
  draggable?: DraggableProvided
  counter?: React.ReactNode
}) {

  const [showConfirmDeleteAnswers, setShowConfirmDeleteAnswers] = useState(false)
  const [showConfirmDeleteQuestion, setShowConfirmDeleteQuestion] = useState(false)

  const onAction = (action: QuestionAction) => {
    if (props.onAction) {
      props.onAction(action)
    }
  }

  const confirmDeleteAnswers = () => {
    onAction("deleteAnswers")
    setShowConfirmDeleteAnswers(false)
  }

  const confirmDeleteQuestion = () => {
    onAction("deleteQuestion")
    setShowConfirmDeleteQuestion(false)
  }

  return (
    <Box pb="2rem" key={props.question.prop} ref={props.draggable?.innerRef} {...props.draggable?.draggableProps}>
      {props.progressSections && (
        <Group spacing={5} noWrap mt="xs" mb="md">
          {props.counter}
          <Progress
            size="xl"
            radius="xl"
            sections={props.progressSections}
            sx={{ width: "100%" }}
          />
        </Group>
      )}
      <Group spacing={5} mb="lg" noWrap position='center'>
        {props.draggable && (
          <Group style={props.onAction ? undefined : { display: "none" }}>
            <ThemeIcon variant='light' color="gray" style={{ cursor: "grab", alignSelf: "flex-start" }} {...props.draggable?.dragHandleProps}>
              <IconGripVertical size={16} />
            </ThemeIcon>
          </Group>
        )}
        <Text weight="bold" size="xl" align='center'>
          {props.index !== undefined && (
            <Badge color="gray" variant='outline' size="lg" mr="md" sx={{ position: "relative", bottom: 2 }}>Q{props.index + 1}</Badge>
          )}
          {props.question.text}
        </Text>
        {props.onAction && (
          <Menu shadow="md">
            <Menu.Target>
              <ActionIcon variant='light'>
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Actions</Menu.Label>
              <Menu.Item onClick={() => onAction("editQuestion")} icon={<IconEdit size={14} />}>Edit question</Menu.Item>
              <Menu.Item color="red" onClick={() => setShowConfirmDeleteAnswers(true)} icon={<IconTrash size={14} />}>Delete all the answers</Menu.Item>
              <Menu.Item color="red" onClick={() => setShowConfirmDeleteQuestion(true)} icon={<IconTrash size={14} />}>Delete question</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
      <Group mt="xs" position='center'>
        {props.question.answers.map((a, i) => (
          <AnswerItem key={String(a.value)} answer={a} value={props.answer} onAnswer={props.onAnswer} />
        ))}
      </Group>

      <Modal
        opened={showConfirmDeleteAnswers}
        onClose={() => setShowConfirmDeleteAnswers(false)}
        title="Delete answers"
      >
        <Alert icon={<IconAlertCircle size={16} />} title="Warning" color="red">
          You&apos;re about to delete all the answers registered for the selected question:
          <blockquote>{props.question.text || "No text..."}</blockquote>
          <Text weight="bold">Are you sure?</Text>
        </Alert>
        <Group mt="md" position='right'>
          <Button variant="default" onClick={() => setShowConfirmDeleteAnswers(false)}>Back</Button>
          <Button color="red" onClick={confirmDeleteAnswers}>Confirm</Button>
        </Group>
      </Modal>

      <Modal
        opened={showConfirmDeleteQuestion}
        onClose={() => setShowConfirmDeleteQuestion(false)}
        title="Delete question"
      >
        <Alert icon={<IconAlertCircle size={16} />} title="Warning" color="red">
          You&apos;re about to delete the question:
          <blockquote>{props.question.text || "No text..."}</blockquote>
          <Text weight="bold">Are you sure?</Text>
        </Alert>
        <Group mt="md" position='right'>
          <Button variant="default" onClick={() => setShowConfirmDeleteQuestion(false)}>Back</Button>
          <Button color="red" onClick={confirmDeleteQuestion}>Confirm</Button>
        </Group>
      </Modal>
    </Box>
  )
}

const SelectItem = forwardRef<HTMLDivElement, ItemProps>(
  ({ label, text, ...others }: ItemProps, ref) => (
    <div ref={ref} key={text} {...others}>
      <Group noWrap>
        <div>
          <span style={{ display: "block", marginBottom: 2 }}>{label}</span>
          <span style={{ fontSize: "0.8em", opacity: 0.8, lineHeight: "0.8em" }}>
            {text}
          </span>
        </div>
      </Group>
    </div>
  )
);
SelectItem.displayName = "QuestionSelectItem";

export function QuestionForm(props: {
  question?: Question
  onSave?: (question: Question) => void
  onBack?: () => void
  questions?: Question[]
}) {

  const q = useForm<Question>({
    initialValues: {
      text: "",
      prop: "",
      answers: []
    }
  })

  useEffect(() => {
    q.setValues({
      ...(props.question || {}),
      text: props.question?.text || "",
      prop: props.question?.prop || "",
      // adding an temporary id to the answer items
      answers: props.question?.answers.map((a, i) => ({ ...a, id: a.label + i })) || []
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.question])

  const handleDrop = ({ source, destination }: DropResult) => {
    if (destination) {
      q.reorderListItem('answers', { from: source.index, to: destination.index })
      if (source.index !== destination.index) {
        q.setDirty({ answers: true })
      }
    }
  }

  const handleBack = () => {
    if (props.onBack) {
      props.onBack()
    }
  }

  const handleSave = () => {
    if (props.onSave) {
      props.onSave({
        ...q.values,
        answers: q.values.answers.map(answer => {
          let a = JSON.parse(JSON.stringify(answer))
          if (a.id) delete a.id
          return a
        })
      })
    }
  }

  const setAnswerValue = (i: number, value: any) => {
    q.setFieldValue(`answers.${i}.value`, value)
  }

  const convertAnswerValue = (i: number, type: "boolean" | "number" | "string") => {
    let v = q.values.answers[i].value
    if (type === "boolean") {
      v = Boolean(v)
    }
    else if (type === "number") {
      v = Number(v)
    }
    else if (type === "string") {
      v = String(v)
    }
    q.setFieldValue(`answers.${i}.value`, v)
  }

  const addNewAnswer = () => {
    q.insertListItem("answers", {
      id: (new Date()).getTime(),
      label: "",
      value: ""
    })
  }

  const deleteAnswer = (i: number) => {
    q.removeListItem("answers", i)
  }

  const addCriteria = (i: number, j: number) => {
    const relevancy = JSON.parse(JSON.stringify(q.values.relevancy || []))
    const block = relevancy[i]
    block.splice(j + 1, 0, { prop: "" })
    relevancy.splice(i, 1, block)
    q.setValues({ ...q.values, relevancy })
  }

  const addCriteriaBlock = () => {
    const relevancy = JSON.parse(JSON.stringify(q.values.relevancy || []))
    relevancy.push([{ prop: "" }])
    q.setValues({ ...q.values, relevancy })
  }

  const deleteCriteria = (i: number, j: number) => {
    const relevancy = JSON.parse(JSON.stringify(q.values.relevancy || []))
    const block = relevancy[i]
    block.splice(j, 1)
    if (block.length === 0) {
      relevancy.splice(i, 1)
    }
    else {
      relevancy.splice(i, 1, block)
    }
    q.setValues({ ...q.values, relevancy })
  }

  const deleteCriteriaBlock = (i: number) => {
    const relevancy = JSON.parse(JSON.stringify(q.values.relevancy || []))
    relevancy.splice(i, 1)
    let newQ: Question = { ...q.values, relevancy }
    if (newQ.relevancy?.length === 0) {
      delete newQ.relevancy
    }
    q.setValues(newQ)
  }

  const setCriteriaQuestion = (i: number, j: number, v: any) => {
    const relevancy = JSON.parse(JSON.stringify(q.values.relevancy || []))
    const block = relevancy[i]
    block.splice(j, 1, { ...block[j], prop: v })
    relevancy.splice(i, 1, block)
    q.setValues({ ...q.values, relevancy })
  }

  const setCriteriaAnswer = (i: number, j: number, v: any) => {
    const relevancy = JSON.parse(JSON.stringify(q.values.relevancy || []))
    const block = relevancy[i]
    block.splice(j, 1, { ...block[j], value: v })
    relevancy.splice(i, 1, block)
    q.setValues({ ...q.values, relevancy })
  }

  return (
    <Stack>
      <Title mt="md" order={3}>Edit question</Title>
      <Textarea
        placeholder="Enter the question text..."
        label="Question"
        withAsterisk
        autosize
        minRows={2}
        {...q.getInputProps('text')}
      />
      <TextInput
        label="Attribute name"
        withAsterisk
        {...q.getInputProps('prop')}
      />
      <Input.Label>Answers list</Input.Label>
      <DragDropContext onDragEnd={handleDrop}>
        <Droppable droppableId="answers-dnd-list" direction="vertical">
          {(dropProvided, dropSnap) => (
            <div {...dropProvided.droppableProps} ref={dropProvided.innerRef}>
              {q.values.answers.map((a, i) => (
                <Draggable key={a.id} index={i} draggableId={String(a.id)}>
                  {(dragProvided, dragSnap) =>
                    <Group pb="md" noWrap ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                      <ThemeIcon mt={16} variant='light' color="gray" style={{ cursor: "grab" }} {...dragProvided.dragHandleProps}>
                        <IconGripVertical size={16} />
                      </ThemeIcon>
                      <Group>
                        <TextInput
                          description="Answer label"
                          withAsterisk
                          {...q.getInputProps(`answers.${i}.label`)}
                        />
                        <TextInput
                          description="Answer value"
                          withAsterisk
                          {...q.getInputProps(`answers.${i}.value`)}
                          value={String(q.values.answers[i].value) || ""}
                          rightSection={
                            <Menu shadow="md" width={200}>
                              <Menu.Target>
                                <ActionIcon>
                                  <IconChevronDown size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Value type: {q.values.answers[i].value === null ? "null" : typeof q.values.answers[i].value}</Menu.Label>
                                <Menu.Item rightSection={
                                  <Tooltip label={<span>Anything will be converted as <em>true</em>, an empty field will be converted as <em>false</em>.</span>}>
                                    <ThemeIcon variant='light' color="gray">
                                      <IconInfoCircle size={14} />
                                    </ThemeIcon>
                                  </Tooltip>
                                } onClick={() => convertAnswerValue(i, "boolean")}>Convert to boolean</Menu.Item>
                                <Menu.Item disabled={isNaN(q.values.answers[i].value)} onClick={() => convertAnswerValue(i, "number")}>Convert to number</Menu.Item>
                                <Menu.Item onClick={() => convertAnswerValue(i, "string")}>Convert to text</Menu.Item>
                                <Menu.Item onClick={() => setAnswerValue(i, undefined)}>Set <em>undefined</em></Menu.Item>
                                <Menu.Item onClick={() => setAnswerValue(i, null)}>Set <em>null</em></Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          }
                        />
                        <ColorInput description="Color" {...q.getInputProps(`answers.${i}.color`)} />
                        <CloseButton mt={16} onClick={() => deleteAnswer(i)} />
                      </Group>
                    </Group>
                  }
                </Draggable>
              ))}
              {dropProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Group>
        <Button leftIcon={<IconPlus size={16} />} variant="default" onClick={addNewAnswer}>Add new answer</Button>
      </Group>
      <Input.Wrapper label="Relevancy tests" description="For this question to be relevant for a given task, the answers to the previous questions must meet the following criteria">
        {props.questions && (q.values.relevancy || []).map((andBloc, i) => (
          <Box key={"or" + i}>
            <Paper mt="md" withBorder p="md">
              <Tooltip label="Delete criteria bloc" withArrow>
                <CloseButton sx={{ float: "right" }} onClick={() => deleteCriteriaBlock(i)} />
              </Tooltip>
              {andBloc.map((orBloc, j) => (
                <Box key={"and" + String(i) + String(j)}>
                  {props.questions && (
                    <Group>
                      <Select
                        label="Question"
                        placeholder="Pick one"
                        value={orBloc.prop}
                        data={props.questions.map((q, k) => ({ value: q.prop, text: q.text, label: "Q" + (k + 1) }))}
                        itemComponent={SelectItem}
                        onChange={v => setCriteriaQuestion(i, j, v)}
                      />
                      <Select
                        disabled={!orBloc.prop}
                        label="Answer"
                        value={orBloc.value}
                        data={((props.questions.find(q => orBloc.prop === q.prop) || {} as Question).answers || []).map(d => ({ value: d.value, label: d.label }))}
                        onChange={v => setCriteriaAnswer(i, j, v)}
                      />
                      <Tooltip label="Add criteria" withArrow>
                        <ActionIcon variant='subtle' color="blue" size="lg" mt="1.5em" onClick={() => addCriteria(i, j)}>
                          <IconPlus size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete criteria" withArrow>
                        <CloseButton onClick={() => deleteCriteria(i, j)} size="lg" mt="1.5em" />
                      </Tooltip>
                    </Group>
                  )}
                  {j < andBloc.length - 1 && (
                    <Text italic sx={{ opacity: 0.75, userSelect: "none" }} p="md">— Or —</Text>
                  )}
                </Box>
              ))}
            </Paper>
            {i < (props.question?.relevancy || []).length - 1 && (
              <Text italic sx={{ opacity: 0.75, userSelect: "none" }} pt="md" ml="lg">—— And ——</Text>
            )}
          </Box>
        ))}
        {props.questions && (
          <Group mt="md">
            <Button leftIcon={<IconPlus size={16} />} variant="default" onClick={addCriteriaBlock}>Add new criteria block</Button>
          </Group>
        )}
      </Input.Wrapper>
      <Group position='right'>
        <Button variant="default" onClick={handleBack}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </Group>
    </Stack>
  )
}


export function QuestionsBloc(props: {
  values: Annotations
  onChange: (props: keyof Annotations, value: any) => void
  actionsChildren?: React.ReactNode
  questions: Question[]
  questionIndex?: number
  currentTaskIndex?: number
  tasks?: Task[]
  onQuestionIndexChange?: (value: number) => void
  onSkip?: () => void
  onAction?: (action: QuestionAction, q: Question, i: number) => void
  onQuestionsUpdate?: (questions: Question[]) => void
  relevancyFailedBlocs?: RelevancyTest[][]
}) {

  const [activeTab, setActiveTab] = useState<string | null>(props.questionIndex ? String(props.questionIndex) : "0");
  const [showEditQuestion, setShowEditQuestion] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | undefined>()

  useEffect(() => {
    setActiveTab(props.questionIndex ? String(props.questionIndex) : "0")
  }, [props.questionIndex])

  const handleAnswer = (q: Question, value: any) => {
    props.onChange(q.prop, value)
  }

  const onTabChange = (value: string) => {
    setActiveTab(value)
    if (props.onQuestionIndexChange) {
      props.onQuestionIndexChange(Number(value))
    }
  }

  const onSkip = () => {
    if (props.onSkip) {
      props.onSkip()
    }
  }

  const getRelevantTasks = (q: Question) => {
    return props.tasks?.filter(t => !testRelevancy(q, t).length) || []
  }

  const convertTaskIndex = (q: Question) => {
    const rt = getRelevantTasks(q)
    if (props.currentTaskIndex !== undefined && props.tasks) {
      const task = props.tasks[props.currentTaskIndex]
      const i = rt.findIndex(t => t.id === task.id)
      return i < 0 ? '?' : i
    }
    return rt.length
  }

  const buildProgressSections = (q: Question) => {
    const t = getRelevantTasks(q).length || 1
    return q.answers.map(a => {
      const n = props.tasks?.filter(t => (t.annotations ? t.annotations[q.prop] : undefined) === a.value).length || 0
      const percentage = Math.round((n / t) * 100)
      return {
        value: percentage,
        label: percentage > 10 ? String(n) : undefined,
        color: a.color,
        tooltip: `${a.label} (${percentage}%) - ${n} / ${t}`
      } as ProgressSection
    })
  }

  const handleAction = (action: QuestionAction, q: Question, i: number) => {
    if (action === "editQuestion") {
      setSelectedQuestion(q)
      setShowEditQuestion(true)
    }
    else if (props.onAction) {
      props.onAction(action, q, i)
    }
  }

  const handleDrop = (result: DropResult) => {
    if (result.destination && props.onQuestionsUpdate) {
      const from = result.source.index
      const to = result.destination.index
      const list = JSON.parse(JSON.stringify(props.questions))
      const item = list.splice(from, 1)
      list.splice(to, 0, item[0])
      props.onQuestionsUpdate(list)
    }
  }

  const handleSave = (question: Question) => {
    if (props.onQuestionsUpdate) {
      const i = props.questions.findIndex(q => q.prop === question.prop)
      const list = JSON.parse(JSON.stringify(props.questions))
      if (i >= 0) {
        list.splice(i, 1, question)
      }
      else {
        list.push(question)
      }
      props.onQuestionsUpdate(list)
      setSelectedQuestion(undefined)
      setShowEditQuestion(false)
    }
  }

  const addQuestion = () => {
    const q: Question = {
      text: "",
      prop: String(props.questions.length),
      answers: []
    }
    setSelectedQuestion(q)
    setShowEditQuestion(true)
  }

  if (props.questionIndex !== undefined) {
    return (
      <Tabs value={activeTab} onTabChange={onTabChange}>
        <Group noWrap>
          <Tabs.List sx={{ width: "100%" }}>
            {props.questions.map((q, i) => {
              const id = `Q${i + 1}`
              const n = props?.tasks?.filter(t => t.annotations && t.annotations[q.prop] !== undefined)?.length
              return (
                <Tabs.Tab
                  key={id}
                  color={q.answers.some(a => a.value === undefined) ? 'cyan' : 'blue'}
                  rightSection={
                    props.tasks && n ? (
                      <Badge sx={{ minWidth: 16, height: 16, pointerEvents: 'none' }}
                        variant="filled"
                        size="xs"
                        color={q.answers.some(a => a.value === undefined) ? 'cyan' : 'blue'}
                      >
                        {n}
                      </Badge>
                    ) : null
                  }
                  value={String(i)}
                >
                  <Text>{id}</Text>
                </Tabs.Tab>
              )
            })}
          </Tabs.List>

        </Group>
        {props.questions.map((q, i) => {
          return (
            <Tabs.Panel key={q.prop + "-content"} value={String(i)}>
              <QuestionItem
                question={q}
                answer={props.values[q.prop]}
                onAnswer={v => handleAnswer(q, v)}
                progressSections={buildProgressSections(q)}
                counter={
                  props.tasks && props.currentTaskIndex !== undefined ? (
                    <TasksCounter
                      value={convertTaskIndex(q)}
                      max={getRelevantTasks(q).length || 0}
                    />
                  ) : undefined
                }
              />
              <Stack>
                {props.values[q.prop] !== undefined && (
                  <Alert icon={<IconAlertCircle size={24} />} title="You already answered">
                    <div>
                      <div>Clicking on the selected answer will delete it.</div>
                      <Button mt="md" onClick={onSkip} rightIcon={<IconArrowRight size={16} />}>Skip</Button>
                    </div>
                  </Alert>
                )}
                {props.relevancyFailedBlocs !== undefined && props.relevancyFailedBlocs.length > 0 && (
                  <Alert icon={<IconAlertCircle size={24} />} title="Question not relevant" color="orange">
                    <div>
                      <div>No answer is expected for this question.</div>
                      <Text my="xs" size="xs">The irrelevancy of this question is based on the following answers:</Text>
                      {props.relevancyFailedBlocs.map((andBloc, i) => (
                        <div key={i}>
                          <div>
                            {andBloc.map(orBloc => {
                              const que = props.questions.find(q => q.prop === orBloc.prop) || {} as Question
                              const queIndex = props.questions.findIndex(q => q.prop === orBloc.prop) || 0
                              return (
                                <div
                                  key={`${orBloc.prop}-${String(orBloc.value)}`}
                                >
                                  <Tooltip label={que.text} withArrow>
                                    <Badge color="orange" variant='filled' mr="xs">Q{queIndex + 1}</Badge>
                                  </Tooltip>
                                  <Tooltip label="Expected answer" withArrow>
                                    <span style={{ marginRight: "1em" }}>→ {String((que?.answers?.find(a => a.value === orBloc.value) || {}).label)} </span>
                                  </Tooltip>
                                  <Tooltip label="Your answer" withArrow>
                                    <em>(≠ {String((que?.answers?.find(a => a.value === props.values[orBloc.prop]) || {}).label)})</em>
                                  </Tooltip>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                      <Button mt="md" color="orange" onClick={onSkip} rightIcon={<IconArrowRight size={16} />}>Skip</Button>
                    </div>
                  </Alert>
                )}
              </Stack>
            </Tabs.Panel>
          )
        })}
      </Tabs>
    )
  }

  return showEditQuestion ? (
    <Box>
      <QuestionForm
        question={selectedQuestion}
        onBack={() => setShowEditQuestion(false)}
        onSave={handleSave}
        questions={props.questions}
      />
    </Box>
  ) : (
    <Box>
      {props.onQuestionsUpdate && (
        <Group>
          <Button leftIcon={<IconPlus size={16} />} onClick={addQuestion}>Add question</Button>
        </Group>
      )}
      <DragDropContext onDragEnd={handleDrop}>
        <Droppable droppableId="questions-dnd-list" direction="vertical">
          {(dropProvided, dropSnap) => (
            <div {...dropProvided.droppableProps} ref={dropProvided.innerRef}>
              {props.questions.map((q, i) => (
                <Draggable key={q.prop} index={i} draggableId={q.prop}>
                  {(dragProvided, dragSnap) =>
                    <QuestionItem
                      draggable={dragProvided}
                      key={q.prop}
                      index={i}
                      question={q}
                      answer={props.values[q.prop]}
                      onAnswer={v => handleAnswer(q, v)}
                      onAction={props.onAction ? a => handleAction(a, q, i) : undefined}
                    />
                  }
                </Draggable>
              ))}
              {dropProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </Box>
  )
}


export function ColorInput(props: {
  label?: string
  description?: string
  value: string
  onChange?: (value: string) => void
  useColorList?: boolean
}) {

  const { classes } = useStyle()
  const [opened, setOpened] = useState(false);
  const [value, setValue] = useState(props.value)
  const [textColor, setTextColor] = useState("black")

  useEffect(() => {
    setValue(props.value)
    if (props.value) {
      setTextColor(getContrastColor(props.value))
    }
  }, [props.value])

  const onChange = (hexColor: string) => {
    setValue(hexColor)
    setTextColor(getContrastColor(hexColor))
  }

  const onSave = () => {
    if (props.onChange) {
      props.onChange(value)
      setOpened(false)
    }
  }

  const onBack = () => {
    setValue(props.value)
    setOpened(false)
  }

  const showPopover = () => {
    if (props.onChange) {
      setOpened((o) => !o)
    }
  }

  const randomizeColor = () => {
    onChange(buildColor())
  }

  return (
    <Popover position="bottom" withArrow shadow="md" opened={opened} onChange={setOpened}>
      <Popover.Target>
        <Input.Wrapper label={props.label} description={props.description}>
          <ColorSwatch my={6} color={value} onClick={showPopover} style={{ cursor: "pointer" }} />
        </Input.Wrapper>
      </Popover.Target>
      <Popover.Dropdown>
        <div className={classes.colorPreview} style={{ background: value, color: textColor }}>
          <span style={{ opacity: 0.5 }}>{value}</span>
        </div>
        <ColorPicker value={value} onChange={onChange} />
        {props.useColorList !== false && (
          <Select
            mt="xs"
            value={String(value).includes('#') ? '#000000' : value}
            onChange={v => setValue(String(v))}
            data={[
              { value: 'gray', label: 'Gray' },
              { value: 'red', label: 'Red' },
              { value: 'pink', label: 'Pink' },
              { value: 'grape', label: 'Grape' },
              { value: 'violet', label: 'Violet' },
              { value: 'indigo', label: 'Indigo' },
              { value: 'blue', label: 'Blue' },
              { value: 'cyan', label: 'Cyan' },
              { value: 'teal', label: 'Teal' },
              { value: 'green', label: 'Green' },
              { value: 'lime', label: 'Lime' },
              { value: 'yellow', label: 'Yellow' },
              { value: 'orange', label: 'Orange' },
              { value: '#000000', label: 'Custom' },
              { value: '', label: 'No color' },
            ]}
          />
        )}
        <Group position='right' mt="md" spacing={5}>
          <Button variant='default' onClick={onBack}>Back</Button>
          <Tooltip label="Randomize color" withArrow>
            <ActionIcon size="lg" onClick={randomizeColor}>
              <IconRefresh />
            </ActionIcon>
          </Tooltip>
          <Button onClick={onSave}>Save</Button>
        </Group>
      </Popover.Dropdown>
    </Popover>

  )
}


export function Sentence(props: {
  item: Sentence
  topics: Topic[]
  relevantTopics?: string[]
  onTopicChange: (value: number) => void
  onTopicUpdate: (topic: Topic) => void
}) {

  const { classes, cx } = useStyle()

  const topic = useMemo(() => props.topics.find(t => t.id === props.item.topic) || {} as Topic, [props.topics, props.item])
  const topicColor = topic.color || ""
  const selectData = [...props.topics.map(topicToSelectItem), ...[{ value: "-1", label: "No topic" }]]
  const [showChange, setShowChange] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [localName, setLocalName] = useState(topic.name)
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    setLocalName(topic.name)
  }, [topic])

  const onColorChange = (color: string) => {
    props.onTopicUpdate({ ...topic, color })
  }

  const showRenameTopic = () => {
    const show = !showInput
    setShowInput(show)
  }

  const handleTopicChange = (v: string) => {
    props.onTopicChange(Number(v))
    setShowChange(false)
  }

  const onNameChange = () => {
    props.onTopicUpdate({ ...topic, name: localName })
    setShowInput(false)
  }

  return (
    <Popover withArrow shadow="md" opened={opened} onChange={setOpened}>
      <Popover.Target>
        <span onClick={() => setOpened(v => !v)}>
          <span
            style={(!props.relevantTopics || props.relevantTopics?.includes(String(topic.id))) ? {
              background: topicColor,
              color: topicColor ? getContrastColor(topicColor) : undefined
            } : undefined}
            className={cx(classes.sentence, { [classes.highlightedText]: topicColor })}
          >
            {props.item.text}
          </span><span> </span>
        </span>
      </Popover.Target>
      <Popover.Dropdown>
        <Box>
          <Group>
            <span className={classes.textPreview}>{props.item.text}</span>
            <CloseButton onClick={() => setOpened(false)} />
          </Group>
          <Group py="md" spacing={10}>
            {showChange ? (
              <Select
                style={{ width: "100%" }}
                data={selectData}
                label="Topics"
                value={topic?.id?.toString() || "-1"}
                onChange={handleTopicChange}
                maxDropdownHeight={300}
                searchable
              />
            ) : (
              <>
                <ColorInput value={topicColor} onChange={onColorChange} />
                {showInput ? (
                  <TextInput
                    value={localName}
                    onChange={e => setLocalName(e.target.value)}
                    style={{ flex: 1 }}
                    rightSection={
                      <ActionIcon variant="filled" color="green" onClick={onNameChange}>
                        <IconCheck />
                      </ActionIcon>
                    }
                  />
                ) : (
                  <Text size="xl">{topic.name || "No topic..."}</Text>
                )}
              </>
            )}
          </Group>
          <Group position='right'>
            {topic.id && (
              <Button mr="auto" variant="subtle" color="gray" onClick={showRenameTopic}>Rename topic</Button>
            )}
            {showChange ? (
              <Button variant="default" onClick={() => setShowChange(v => !v)}>Cancel topic change</Button>
            ) : (
              <Button variant="default" onClick={() => setShowChange(v => !v)}>Change sentence topic</Button>
            )}
          </Group>
        </Box>
      </Popover.Dropdown>
    </Popover>
  )
}


export function TopicLine(props: {
  topic: Topic
  checked: boolean
  relatedTasks: Task[]
  onCheck: () => void
  onChange: (value: Topic) => void
  selectTopic: () => void
  draggable?: DraggableProvided
  showTopicsDragHandles?: boolean
}) {

  const { classes } = useStyle()
  const [localName, setLocalName] = useState(props.topic.name)
  const [showInput, setShowInput] = useState(false)

  useEffect(() => {
    setLocalName(props.topic.name)
  }, [props.topic])

  const onNameChange = () => {
    props.onChange({ ...props.topic, name: localName })
    setShowInput(false)
  }

  const onColorChange = (color: string) => {
    props.onChange({ ...props.topic, color })
  }

  return (
    <Group noWrap className={classes.topicLine} ref={props.draggable?.innerRef} {...props.draggable?.draggableProps}>
      {props.draggable && (
        <Group>
          <ThemeIcon style={props.showTopicsDragHandles ? { cursor: "grab", alignSelf: "flex-start" } : { display: "none" }} variant='light' color="gray" {...props.draggable?.dragHandleProps}>
            <IconGripVertical size={16} />
          </ThemeIcon>
        </Group>
      )}
      <Checkbox checked={!!props.checked} onChange={props.onCheck} />
      {showInput ? (
        <TextInput
          value={localName}
          onChange={e => setLocalName(e.target.value)}
          style={{ flex: 1 }}
          rightSection={
            <ActionIcon variant="filled" color="green" onClick={onNameChange}>
              <IconCheck />
            </ActionIcon>
          }
        />
      ) : (
        <Group style={{ flex: 1 }}>
          <div style={{ overflow: "hidden", display: "flex", flex: 1 }}>
            <Text title={`${localName} (${props.topic.id})`} className={classes.topic} onClick={props.onCheck}>{localName}</Text>
          </div>
          <Tooltip label="ID" withArrow>
            <Text>#{props.topic.id}</Text>
          </Tooltip>
          <Tooltip label="Edit name" withArrow>
            <ActionIcon style={{ margin: "0 3px", opacity: 0.5 }} onClick={() => setShowInput(v => !v)}>
              <IconEdit />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
      <Tooltip label="Related documents" withArrow>
        <ActionIcon variant='outline' onClick={() => props.selectTopic()}>
          <Text size="xs">{props.relatedTasks.length}</Text>
        </ActionIcon>
      </Tooltip>
      <ColorInput value={props.topic.color} onChange={onColorChange} />
    </Group>
  )
}


export function TopicsList(props: {
  task: Task
  topics: Topic[]
  questions?: Question[]
  onSaveMapping?: (questions: Question[]) => void
  onTopicUpdate?: (topic: Topic) => void
  tasks?: Task[]
  questionIndex?: number
}) {

  const [selectedTopic, setSelectedTopic] = useState<Topic | undefined>()
  const [localName, setLocalName] = useState("")
  const [showInput, setShowInput] = useState(false)
  const [localQuestions, setLocalQuestions] = useState<Question[]>([])

  const topicsMap = useMemo(() => {
    const topicsId = props.task.sentences.map(s => s.topic);
    let topicsMap: any = {}
    for (const topicId of topicsId) {
      if (topicsMap[topicId] === undefined) {
        topicsMap[topicId] = 1
      }
      else {
        topicsMap[topicId]++
      }
    }
    return topicsMap
  }, [props.task])

  const topicsMapValues = useMemo(() => Object.values(topicsMap) as number[], [topicsMap])
  const relatedTasks = useMemo(() => props.tasks?.filter(task => task.sentences.some(s => s.topic == selectedTopic?.id)) || [], [props.tasks, selectedTopic])
  const relatedSentences = useMemo(() => props.tasks?.reduce((a, t) => a.concat(t.sentences.filter(s => s.topic == selectedTopic?.id)), [] as Sentence[]) || [], [props.tasks, selectedTopic])

  useEffect(() => {
    setLocalName(selectedTopic?.name || "")
  }, [selectedTopic])

  useEffect(() => {
    if (props.questions) {
      setLocalQuestions(props.questions)
    }
  }, [props.questions])

  const onNameChange = () => {
    if (selectedTopic) {
      setSelectedTopic({ ...selectedTopic, name: localName })
      setShowInput(false)
    }
  }

  const onColorChange = (color: string) => {
    if (selectedTopic) {
      setSelectedTopic({ ...selectedTopic, color })
    }
  }

  const onSave = () => {
    if (selectedTopic) {
      if (props.onTopicUpdate) {
        props.onTopicUpdate(JSON.parse(JSON.stringify(selectedTopic)))
        setSelectedTopic(undefined)
      }
      if (props.onSaveMapping) {
        props.onSaveMapping(localQuestions)
      }
    }
  }

  return (
    <Group mt="md" spacing={5}>
      {Object.keys(topicsMap).map((tId, i) => {
        const topic: Topic = props.topics.find(t => t.id == tId) || {} as Topic
        return topic.name ? (
          <Tooltip key={tId} withArrow label={
            <div>
              <div style={{ borderBottom: "thin solid rgba(255,255,255,0.2)", paddingBottom: 5, marginBottom: 5 }}>{topic.name}</div>
              <div>
                <span style={{ paddingRight: "1.5em" }}>ID: {topic.id}</span>
                <span>Sentences: {topicsMapValues[i]}</span>
              </div>
            </div>
          }>
            <ColorSwatch color={topic.color} onClick={() => setSelectedTopic(topic)} >
              <Text size="sm" sx={{ color: getContrastColor(topic.color) }}>{topic.id}</Text>
            </ColorSwatch>
          </Tooltip>
        ) : (
          <Tooltip key={tId} withArrow label={
            <div>
              <div style={{ borderBottom: "thin solid rgba(255,255,255,0.2)", paddingBottom: 5, marginBottom: 5 }}>No topic</div>
              <div>
                <span>Sentences: {topicsMapValues[i]}</span>
              </div>
            </div>
          }>
            <ColorSwatch color={topic.color}>
              <Text size="sm">Ø</Text>
            </ColorSwatch>
          </Tooltip>
        )
      })}
      <Modal
        opened={!!selectedTopic}
        onClose={() => setSelectedTopic(undefined)}
        title="Topic details"
        size="xl"
      >
        <Group>
          <ColorInput value={selectedTopic?.color || ""} onChange={onColorChange} />
          {showInput ? (
            <TextInput
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              style={{ flex: 1 }}
              rightSection={
                <ActionIcon variant="filled" color="green" onClick={onNameChange}>
                  <IconCheck />
                </ActionIcon>
              }
            />
          ) : (
            <Text size="xl">{selectedTopic?.name || ""}</Text>
          )}
        </Group>
        <Group mt="md">
          <Button variant="default" color="gray" onClick={() => setShowInput(v => !v)}>Rename topic</Button>
        </Group>
        {selectedTopic && (
          <Accordion mt="md">
            {!!props.tasks && (
              <Accordion.Item value="tasks">
                <Accordion.Control>Related documents ({relatedTasks.length})</Accordion.Control>
                <Accordion.Panel pt="xs">
                  <TasksList tasks={relatedTasks} topics={props.topics} selectedTopic={selectedTopic} />
                </Accordion.Panel>
              </Accordion.Item>
            )}
            {!!props.tasks && (
              <Accordion.Item value="sentences">
                <Accordion.Control>Related sentences ({relatedSentences.length})</Accordion.Control>
                <Accordion.Panel pt="xs">
                  <SentencesList sentences={relatedSentences} />
                </Accordion.Panel>
              </Accordion.Item>
            )}
            {!!props.questions && (
              <Accordion.Item value="mapping">
                <Accordion.Control>Questions mapping</Accordion.Control>
                <Accordion.Panel pt="xs">
                  <QuestionsTopicsMatrix
                    questions={localQuestions}
                    topics={[selectedTopic]}
                    onChange={q => setLocalQuestions(q)}
                    questionIndex={props.questionIndex}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            )}
          </Accordion>
        )}
        <Group mt="md" position='right'>
          <Button variant='default' onClick={() => setSelectedTopic(undefined)}>Back</Button>
          <Button ml="auto" onClick={onSave}>Save</Button>
        </Group>
      </Modal>
    </Group>
  )
}


export function SentencesList(props: {
  sentences: Sentence[]
}) {
  return (
    <Box>
      {props.sentences.map(s => (
        <Paper key={s.text} p="xs" withBorder mb={5}>
          <Text>{s.text}</Text>
        </Paper>
      ))}
    </Box>
  )
}


export function TasksList(props: {
  tasks: Task[]
  topics: Topic[]
  selectedTopic?: Topic
}) {
  return (
    <Accordion>
      {props.tasks.map(t => (
        <Accordion.Item value={t.id} key={t.id}>
          <Accordion.Control>
            <Text>{t.title}</Text>
            <TopicsList task={t} topics={props.topics} />
          </Accordion.Control>
          <Accordion.Panel>
            <Text>{t.sentences.map(s => s.text).join(" ")}</Text>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  )
}


export function QuestionsTopicsMatrix(props: {
  questions: Question[]
  topics: Topic[]
  onSave?: (questions: Question[]) => void
  onChange?: (questions: Question[]) => void
  questionIndex?: number
  tasks?: Task[]
  selectTopic?: (t: Topic) => void
}) {

  const { classes } = useStyle()
  const [questions, setQuestions] = useState(props.questions)

  useEffect(() => {
    setQuestions(props.questions)
  }, [props.questions])

  const handleSelect = (topic: Topic, question: Question, qIndex: number) => {
    let id = String(topic.id)
    let q = JSON.parse(JSON.stringify(question)) as Question
    if (q.relevantTopics && Array.isArray(q.relevantTopics)) {
      if (q.relevantTopics.includes(id)) {
        if (q.relevantTopics.length <= 1) {
          delete q.relevantTopics
        }
        else {
          q.relevantTopics = q.relevantTopics.filter(rt => rt !== id)
        }
      }
      else {
        q.relevantTopics.push(id)
      }
    }
    else {
      q.relevantTopics = []
    }
    const qList = JSON.parse(JSON.stringify(questions)) as Question[]
    qList.splice(qIndex, 1, q);
    setQuestions(qList)
    if (props.onChange) {
      props.onChange(qList)
    }
  }

  const onSave = () => {
    if (props.onSave) {
      props.onSave(questions)
    }
  }

  const allCheck = (q: Question) => {
    return q.relevantTopics?.length === props.topics.length
  }

  const someSelected = (q: Question) => {
    return q.relevantTopics?.length !== props.topics.length && (q.relevantTopics?.length || 0) > 0
  }

  const clickMainCheckbox = (question: Question, index: number) => {
    const qList = JSON.parse(JSON.stringify(questions)) as Question[]
    const qIndex = qList.findIndex(q => q.prop === question.prop)
    if (qIndex >= 0) {
      let q = qList[qIndex]
      if (allCheck(question)) {
        delete q.relevantTopics
      }
      else {
        q.relevantTopics = props.topics.map(t => String(t.id))
      }
      qList.splice(qIndex, 1, q);
      setQuestions(qList)
    }

  }

  const selectTopic = (t: Topic) => {
    if (props.selectTopic) {
      props.selectTopic(t)
    }
  }

  return (
    <Box>
      {!props.onChange && (
        <Group mb="lg">
          <Button onClick={onSave}>Save mapping</Button>
        </Group>
      )}
      <Table>
        <thead>
          <tr>
            <th>Topics</th>
            {questions.map((q, i) => (
              <th key={q.prop} style={{ fontWeight: "normal" }}>
                <Popover position="bottom" withArrow shadow="md">
                  <Popover.Target>
                    <Button compact variant='outline' color={props.questionIndex === i ? undefined : 'gray'}>Q{i + 1}</Button>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Text mb="md" size="sm">{q.text}</Text>
                    <Checkbox checked={allCheck(q)} indeterminate={someSelected(q)} onChange={() => clickMainCheckbox(q, i)} label="Select all" />
                  </Popover.Dropdown>
                </Popover>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.topics.map(t => (
            <tr key={t.id} className={classes.tableRow}>
              <td title={t.name + ` (${t.id})`}>
                <Group>
                  <span>{t.name} </span>
                  <Tooltip label="Related documents" withArrow>
                    <Button compact color="gray" variant='outline' onClick={() => selectTopic(t)} size="xs">
                      {props.tasks?.filter(task => task.sentences.some(s => s.topic == t.id)).length || '?'}
                    </Button>
                  </Tooltip>
                </Group>
              </td>
              {questions.map((q, i) => (
                <td key={t.id + q.prop}>
                  <Checkbox
                    checked={!!q.relevantTopics?.includes(String(t.id))}
                    indeterminate={!q.relevantTopics}
                    onChange={() => handleSelect(t, q, i)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  )
}


export function TasksCounter(props: {
  value: number | string
  onChange?: (value: number) => void
  max: number
}) {

  const [opened, setOpened] = useState(false);
  const [index, setIndex] = useState<number | undefined>(0)

  useEffect(() => {
    setIndex(JSON.parse(JSON.stringify(!isNaN(props.value as number) ? Number(props.value) + 1 : props.value)))
  }, [props.value])

  const handleSave = () => {
    if (props.onChange && index !== undefined && index > 0 && index <= props.max) {
      props.onChange(index - 1)
      setOpened(false)
    }
  }

  return props.onChange ? (
    <Popover position="bottom" withArrow shadow="md" opened={opened} onChange={setOpened}>
      <Popover.Target>
        <Text sx={{ cursor: "pointer" }} onClick={() => setOpened(v => !v)}>{!isNaN(props.value as number) ? Number(props.value) + 1 : props.value}/{props.max}</Text>
      </Popover.Target>
      <Popover.Dropdown>
        <Group mb="xs">
          <Text size="sm">Go to task number</Text>
          <CloseButton onClick={() => setOpened(false)} size="sm" />
        </Group>
        <Group>
          <NumberInput
            sx={{ width: 100 }}
            value={index}
            onChange={setIndex}
            min={1}
            max={props.max}
            stepHoldDelay={500}
            stepHoldInterval={(t) => Math.max(1000 / t ** 2, 25)}
          />
          <ActionIcon size="lg" ml="auto" color="blue" variant='filled' onClick={handleSave}>
            <IconCheck size={20} />
          </ActionIcon>
        </Group>
      </Popover.Dropdown>
    </Popover>
  ) : (
    <Text size="xs" onClick={() => setOpened(v => !v)}>{!isNaN(props.value as number) ? Number(props.value) + 1 : props.value}/{props.max}</Text>
  )
}


const AnnotationsEditor = () => {

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [collections, setCollections] = useLocalStorage<Collection[]>({
    key: 'annotations-collections',
    defaultValue: [],
  });
  const [selectedCollectionId, setSelectedCollectionId] = useLocalStorage<number>({
    key: 'annotations-selected-collection-id',
    defaultValue: 0,
  });

  const [tasksFile, setTasksFile] = useState<File | null>(null)
  const [topicsFile, setTopicsFile] = useState<File | null>(null)
  const [questionsFile, setQuestionsFile] = useState<File | null>(null)
  const [combinedFile, setCombinedFile] = useState<File | null>(null)

  const [selectedTopics, setSelectedTopics] = useState<(string | number)[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionIndex, setQuestionIndex] = useState<number>(0)
  const [collectionName, setCollectionName] = useState("")
  const [annotations, setAnnotations] = useState<Annotations>({})
  const [bulkAnnotations, setBulkAnnotations] = useState<Annotations>({})
  const [selectedTopic, setSelectedTopic] = useState<Topic | undefined>()
  const [tasksToDelete, setTasksToDelete] = useState<Task[]>([])
  const [tasksToBulkApply, setTasksToBulkApply] = useState<Task[]>([])

  const [showDeletePopover, setShowDeletePopover] = useState(false)
  const [showAddCol, setShowAddCol] = useState(false)
  const [showTopic, setShowTopic] = useState(false)
  const [showDeleteTopics, setShowDeleteTopics] = useState(false)
  const [topicsIncluded, setTopicsIncluded] = useState(false)
  const [questionsIncluded, setQuestionsIncluded] = useState(false)
  const [showBulkAnswers, setShowBulkAnswers] = useState(false)
  const [showTopicsDragHandles, setShowTopicsDragHandles] = useState(false)
  const [deleteTasksWithTopics, setDeleteTasksWithTopics] = useState(false)
  const [showFinish, setShowFinish] = useState(false)

  const filteredTasks = useMemo(() => {
    if (selectedTopics.length > 0) {
      return tasks.filter(t => t.sentences.some(s => selectedTopics.includes(String(s.topic))))
    }
    return tasks
  }, [tasks, selectedTopics])

  const relatedTasks = useMemo(() => tasks?.filter(task => task.sentences.some(s => s.topic == selectedTopic?.id)) || [], [tasks, selectedTopic])
  const relatedSentences = useMemo(() => tasks?.reduce((a, t) => a.concat(t.sentences.filter(s => s.topic == selectedTopic?.id)), [] as Sentence[]) || [], [tasks, selectedTopic])

  useEffect(() => {
    if (collections.length > 0 && !tasks.length) {
      selectCollectionByIndex(String(selectedCollectionId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collections, selectedCollectionId])

  useEffect(() => {
    if (filteredTasks[currentTaskIndex]?.annotations) {
      setAnnotations(filteredTasks[currentTaskIndex].annotations || {})
    }
    else {
      setAnnotations({})
    }
  }, [currentTaskIndex, tasks, filteredTasks])

  const selectCollectionByIndex = (index: string) => {
    const i = Number(index)
    setSelectedCollectionId(i)
    const c = collections[i];
    if (c) {
      setTasks(c.tasks)
      if (c.topics) setTopics(c.topics)
      if (c.questions) setQuestions(c.questions)
      setCollectionName(c.name)
    }
    else {
      setSelectedCollectionId(0)
    }
    handleNext(0)
  }

  const selectNextAvailableTask = (tasks?: Task[]) => {
    if (tasks) {
      const i = tasks.findIndex(t => !t.annotations) || -1
      setCurrentTaskIndex(i >= 0 ? i : 0)
    }
    else {
      setCurrentTaskIndex(0)
    }
  }

  const getCollection = (merge?: any): Collection => {
    return {
      ...{
        tasks: tasks,
        topics: topics,
        questions: questions,
        name: collectionName
      }, ...(merge || {})
    }
  }

  const handleTaskTopicChange = (index: number, value: number) => {
    const task = filteredTasks[currentTaskIndex];
    if (task.id) {
      const tIndex = tasks.findIndex(t => t.id === task.id)
      if (tIndex >= 0) {
        task.sentences.splice(index, 1, {
          text: task.sentences[index].text,
          topic: value
        })
        const t = JSON.parse(JSON.stringify(tasks))
        t.splice(tIndex, 1, task)
        setTasks(t)
      }
    }
  }

  const handleTaskTopicUpdate = (topic: Topic) => {
    const top = JSON.parse(JSON.stringify(topics)) as Topic[]
    const i = top.findIndex(t => t.id === topic.id)
    if (i > 0) {
      top.splice(i, 1, topic)
    }
    setTopics(top)
    updateCollection(getCollection({ topics: top }))
  }

  const createCollectionFromMultiple = async () => {
    try {
      if (!collectionName) {
        throw "You have to define a collection name"
      }
      if (collections.map(c => c.name).includes(collectionName)) {
        throw "A collection with this name already exists. Please change the name"
      }
      const tasks = await importFile<Task>(tasksFile, 'tasks')
      if (topicsIncluded && questionsIncluded) {
        setCollections([...collections, {
          name: collectionName,
          tasks: tasks,
          topics: await importFile(topicsFile, 'topics'),
          questions: await importFile<Question>(questionsFile, 'questions')
        }])
      }
      else if (topicsIncluded) {
        setCollections([...collections, {
          name: collectionName,
          tasks: tasks,
          topics: await importFile(topicsFile, 'topics')
        }])
      }
      else if (questionsIncluded) {
        setCollections([...collections, {
          name: collectionName,
          tasks: tasks,
          questions: await importFile<Question>(questionsFile, 'questions')
        }])
      }
      else {
        setCollections([...collections, {
          name: collectionName,
          tasks: tasks,
        }])
      }
      showNotification({ message: "Collection imported", color: "green", icon: <IconCheck size={18} /> })
      setShowAddCol(false)
      setSelectedCollectionId(selectedCollectionId + 1)
    }
    catch (e: any) {
      showNotification({ message: e, color: "red", icon: <IconX size={18} /> })
    }
  }

  const createCollectionFromCombined = async () => {
    try {
      if (!collectionName) {
        throw "You have to define a collection name"
      }
      if (collections.map(c => c.name).includes(collectionName)) {
        throw "A collection with this name already exists. Please change the name"
      }
      const combo = await importFile(combinedFile, 'combo')
      debugger;
      setCollections([...collections, {
        name: collectionName,
        tasks: combo.tasks,
        topics: combo.topics,
        questions: combo.questions
      }])
      showNotification({ message: "Collection imported", color: "green", icon: <IconCheck size={18} /> })
      setShowAddCol(false)
      setSelectedCollectionId(selectedCollectionId + 1)
    }
    catch (e: any) {
      showNotification({ message: e, color: "red", icon: <IconX size={18} /> })
    }
  }

  const handleSaveCollection = () => {
    const c = JSON.parse(JSON.stringify(collections))
    c.splice(selectedCollectionId, 1, getCollection())
    setCollections([...collections, getCollection()])
  }

  const handleDuplicateCollection = () => {
    setCollections([...collections, getCollection()])
  }

  const handleDeleteCollection = () => {
    if (collections.length <= 1) {
      setCollections([])
      setSelectedCollectionId(0)
      setTasks([])
      setTopics([])
    }
    else {
      const c = JSON.parse(JSON.stringify(collections))
      c.splice(selectedCollectionId, 1);
      setCollections(c)
      setSelectedCollectionId(0)
      selectCollectionByIndex("0")
    }

    setShowDeletePopover(false)
    showNotification({ message: "Collection deleted", color: "green", icon: <IconCheck size={18} /> })
  }

  const updateCollection = (values: Collection) => {
    const c = JSON.parse(JSON.stringify(collections))
    c.splice(selectedCollectionId, 1, values);
    setCollections(c)
  }

  const handleTopicChange = (t: Topic, index: number) => {
    const top = JSON.parse(JSON.stringify(topics))
    top.splice(index, 1, t)
    setTopics(top)
    updateCollection(getCollection({ topics: top }))
  }

  const handleCheckTopic = (t: Topic) => {
    const unSel = JSON.parse(JSON.stringify(selectedTopics)) as (string | number)[]
    const tIndex = unSel.findIndex(id => id.toString() === t.id.toString())
    if (tIndex >= 0) {
      unSel.splice(tIndex, 1)
    }
    else {
      unSel.push(String(t.id))
    }
    setSelectedTopics(unSel)
    selectNextAvailableTask()
  }

  const buildTopicName = (s: string) => {
    const sTab = s.split("_") as any[]
    let o = []
    for (const t of sTab) {
      if (t && isNaN(t)) {
        o.push(capitalizeFirstLetter(t))
      }
    }
    return o.join(" ")
  }

  const autoFormat = () => {
    const top = topics.map(t => ({
      ...t,
      name: buildTopicName(t.name)
    }))
    setTopics(top)
    updateCollection(getCollection({ topics: top }))
  }

  const autoColors = () => {
    const top = topics.map(t => ({
      ...t,
      color: buildColor()
    }))
    setTopics(top)
    updateCollection(getCollection({ topics: top }))
  }

  const handleBack = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1)
    }
  }

  const handleBackToFirst = () => {
    setCurrentTaskIndex(0)
  }

  const handleNext = (index?: number, newQuestionIndex?: number) => {

    // basic next task
    if (index === undefined && currentTaskIndex < filteredTasks.length - 1) {
      setCurrentTaskIndex(v => v + 1)
    }

    // recursive next task and question
    if (index !== undefined) {
      const qi = newQuestionIndex === undefined ? questionIndex : newQuestionIndex
      // check if end of list and need to increment the question
      if (index >= filteredTasks.length) {

        // if we can increment the question index
        if (qi < questions.length - 1) {
          handleNext(0, qi + 1)
          setQuestionIndex(qi + 1)
        }
      }
      // a next task exists
      else {
        const t = filteredTasks[index]
        const ann = t.annotations || {} as Annotations
        const q = questions[qi]
        const possibleAnswers = q.answers.map(a => a.value)
        if (qi >= questions.length - 1 && index >= filteredTasks.length - 1) {
          setShowFinish(true)
        }
        // check if the task has already an answer for the current question
        else if (ann[q.prop] !== undefined && possibleAnswers.includes(ann[q.prop])) {
          handleNext(index + 1, qi)
        }
        // check if the task is not relevant
        else if (testRelevancy(q, t).length > 0) {
          handleNext(index + 1, qi)
        }
        // we can select the current task
        else {
          setQuestionIndex(qi)
          setCurrentTaskIndex(index)
        }
      }
    }
  }

  const handleNextToLast = () => {
    if (filteredTasks.length > 0) {
      setCurrentTaskIndex(filteredTasks.length - 1)
    }
  }

  const setQuestionAnswer = (prop: keyof Annotations, value: any) => {
    let q = JSON.parse(JSON.stringify(annotations))
    if (q[prop] === value) {
      delete q[prop]
    }
    else {
      q[prop] = value
    }
    setAnnotations(q)
    if (currentTaskIndex >= filteredTasks.length - 1) {
      handleNextQuestion()
    }
    saveAndNext(q)
  }

  const setBulkQuestionAnswer = (prop: keyof Annotations, value: any) => {
    let q = JSON.parse(JSON.stringify(bulkAnnotations))
    if (q[prop] === value) {
      delete q[prop]
    }
    else {
      q[prop] = value
    }
    setBulkAnnotations(q)
  }

  const handleNextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1)
      handleNext(0)
      showNotification({ message: "Next question", color: "green", icon: <IconCheck size={18} /> })
    }
  }

  const saveAndNext = (ann?: Annotations) => {
    const tId = filteredTasks[currentTaskIndex].id
    if (tId) {
      const tIndex = tasks.findIndex(t => t.id === tId)
      if (tIndex >= 0) {
        const t = JSON.parse(JSON.stringify(tasks))
        t.splice(tIndex, 1, {
          ...t[tIndex],
          annotations: ann || annotations
        })
        setTasks(t)
        updateCollection(getCollection({ tasks: t }))
        setAnnotations({})
        handleNext(currentTaskIndex + 1)
        window.scrollTo(0, 0);
      }
    }
  }

  const exportTasks = () => {
    download(JSON.stringify(tasks), `${collectionName}_tasks.json`, "text/plain")
  }

  const exportTasksSubset = () => {
    download(JSON.stringify(filteredTasks), `${collectionName}_tasks_subset_${filteredTasks.length}.json`, "text/plain")
  }

  const exportTopics = () => {
    download(JSON.stringify(topics), `${collectionName}_topics.json`, "text/plain")
  }

  const exportQuestions = () => {
    download(JSON.stringify(questions), `${collectionName}_questions.json`, "text/plain")
  }

  const exportCombo = () => {
    download(JSON.stringify({ tasks, topics, questions }), `${collectionName}_data.json`, "text/plain")
  }

  const selectTopic = (t: Topic) => {
    setSelectedTopic(t)
    setShowTopic(true)
  }

  const openDeleteTopic = () => {
    const remodeledTasks = tasks.map(t => ({ ...t, sentences: t.sentences.map(s => ({ ...s, topic: selectedTopics.includes(String(s.topic)) ? -1 : s.topic })) }))
    const notTopicTasks = remodeledTasks.filter(t => t.sentences.reduce((a, s) => a && (s.topic == -1 || s.topic === undefined), true))
    setTasksToDelete(notTopicTasks)
    setShowDeleteTopics(true)
  }

  const cancelDeleteTopics = () => {
    setShowDeleteTopics(false)
    setDeleteTasksWithTopics(false)
  }

  const openBulkAnswers = () => {
    const t = tasks.filter(t => t.sentences.some(s => selectedTopics.includes(String(s.topic))))
    setTasksToBulkApply(t)
    setShowBulkAnswers(true)
  }

  const cancelBulk = () => {
    setTasksToBulkApply([])
    setShowBulkAnswers(false)
  }

  const applyBulkAnswers = () => {
    const tasksIds = tasksToBulkApply.map(t => t.id)
    const hasValues = Object.keys(bulkAnnotations).length > 0
    const newTasks = tasks.map(t => {
      if (tasksIds.includes(t.id)) {
        if (hasValues) {
          return {
            ...t,
            annotations: {
              ...(t.annotations || {}),
              ...bulkAnnotations
            }
          }
        }
        else {
          let t2 = JSON.parse(JSON.stringify(t))
          if (t2.annotations) delete t2.annotations
          return t2
        }
      }
      return t;
    })
    setTasks(newTasks)
    updateCollection(getCollection({ tasks: newTasks }))
    setBulkAnnotations({})
    setShowBulkAnswers(false)
    showNotification({ message: `Bulk answers applied to ${tasksIds.length} documents`, color: "green", icon: <IconCheck size={18} /> })
    setTasksToBulkApply([])
  }

  const toggleSelection = () => {
    if (selectedTopics.length > 0 && selectedTopics.length === topics.length) {
      setSelectedTopics([])
    }
    else {
      setSelectedTopics(topics.map(t => String(t.id)))
    }
    selectNextAvailableTask(filteredTasks)
  }

  const confirmDeleteTopics = () => {
    const newTopics = topics.filter(t => !selectedTopics.includes(String(t.id)))
    const newTasks = tasks.map(t => ({ ...t, sentences: t.sentences.map(s => ({ ...s, topic: selectedTopics.includes(s.topic) ? -1 : s.topic })) }))
    setTopics(newTopics)
    if (deleteTasksWithTopics) {
      const tasksToDeleteId = tasksToDelete.map(t => t.id)
      const newTasksDeleted = tasks.filter(t => !tasksToDeleteId.includes(String(t.id)))
      setTasks(newTasksDeleted)
      updateCollection(getCollection({ topics: newTopics, tasks: newTasksDeleted }))
    }
    else {
      updateCollection(getCollection({ topics: newTopics, tasks: newTasks }))
    }
    setSelectedTopics([])
    setShowDeleteTopics(false)
    showNotification({ message: "Collection updated", color: "green", icon: <IconCheck size={18} /> })
  }

  const handleSaveMapping = (questions: Question[]) => {
    setQuestions(questions)
    updateCollection(getCollection({ questions: questions }))
    showNotification({ message: "Saved", color: "green", icon: <IconCheck size={18} /> })
  }

  const handleQuestionAction = (action: QuestionAction, q: Question, i: number) => {
    if (action === "deleteAnswers") {
      const newTasks = tasks.map(task => {
        let t = JSON.parse(JSON.stringify(task))
        if (t.annotations) {
          if (t.annotations[q.prop] !== undefined) delete t.annotations[q.prop]
          if (Object.keys(t.annotations).length === 0) delete t.annotations
        }
        return t
      })
      setTasks(newTasks)
      updateCollection(getCollection({ tasks: newTasks }))
      showNotification({ message: "Answers deleted", color: "green", icon: <IconCheck size={18} /> })
    }
    else if (action === "deleteQuestion") {
      const qList = JSON.parse(JSON.stringify(questions));
      qList.splice(i, 1)
      setQuestions(qList)
      updateCollection(getCollection({ questions: qList }))
      showNotification({ message: "Question deleted", color: "green", icon: <IconCheck size={18} /> })
    }
  }

  const handleDrop = (result: DropResult) => {
    if (result.destination) {
      const from = result.source.index
      const to = result.destination.index
      const list = JSON.parse(JSON.stringify(topics))
      const item = list.splice(from, 1)
      list.splice(to, 0, item[0])
      setTopics(list)
      updateCollection(getCollection({ topics: list }))
      showNotification({ message: "Topics updated", color: "green", icon: <IconCheck size={18} /> })
    }
  }

  const sortTopicsBy = (action: 'tasks' | 'name' | 'count' | 'id', ascending: boolean) => {
    const list = JSON.parse(JSON.stringify(topics)) as Topic[]
    if (action === "tasks") {
      list.sort((a, b) => {
        const na = tasks.filter(task => task.sentences.some(s => s.topic === a.id)).length
        const nb = tasks.filter(task => task.sentences.some(s => s.topic === b.id)).length
        return ascending ? na - nb : nb - na;
      })
    }
    if (action === "count") {
      list.sort((a, b) => {
        const na = a.count || 0
        const nb = b.count || 0
        return ascending ? na - nb : nb - na;
      })
    }
    else if (action === "name") {
      list.sort((a, b) => {
        if (ascending) {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
        }
        else {
          if (b.name < a.name) return -1;
          if (b.name > a.name) return 1;
        }
        return 0;
      })
    }
    else if (action === "id") {
      list.sort((a, b) => {
        if (ascending) {
          if (a.id < b.id) return -1;
          if (a.id > b.id) return 1;
        }
        else {
          if (b.id < a.id) return -1;
          if (b.id > a.id) return 1;
        }
        return 0;
      })
    }
    setTopics(list)
    updateCollection(getCollection({ topics: list }))
    showNotification({ message: "Topics updated", color: "green", icon: <IconCheck size={18} /> })
  }

  const onQuestionsUpdate = (questions: Question[]) => {
    setQuestions(questions)
    updateCollection(getCollection({ questions: questions }))
    showNotification({ message: "Questions updated", color: "green", icon: <IconCheck size={18} /> })
  }


  return (
    <Box>
      <Title order={2} mb="md" align='center'>Annotations</Title>
      <Group mb="md" mx="auto" position="center" spacing={0}>
        <Chip.Group mr="sm" position="center" value={String(selectedCollectionId)} onChange={selectCollectionByIndex}>
          {collections.map((c, i) => (
            <Chip key={c.name} value={String(i)}>{c.name}</Chip>
          ))}
        </Chip.Group>
        <Button variant="outline" radius="xl" onClick={() => setShowAddCol(true)} compact leftIcon={<IconPlus size={16} />}>Add collection</Button>
      </Group>

      <Modal
        opened={showAddCol}
        onClose={() => setShowAddCol(false)}
        title="Add collection"
      >
        <Tabs defaultValue="combined">
          <Tabs.List>
            <Tabs.Tab value="combined">Combined file</Tabs.Tab>
            <Tabs.Tab value="multiple">Multiple files</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="combined" pt="xs">
            <Stack>
              <TextInput
                placeholder="Enter a name..."
                label="Collection name"
                value={collectionName}
                onChange={e => setCollectionName(e.target.value)}
              />
              <FileInput
                placeholder="Upload a data json file..."
                label="Data"
                value={combinedFile}
                onChange={setCombinedFile}
              />
              <Group position='right'>
                <Button onClick={createCollectionFromCombined}>Create collection</Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="multiple" pt="xs">
            <Stack>
              <TextInput
                placeholder="Enter a name..."
                label="Collection name"
                value={collectionName}
                onChange={e => setCollectionName(e.target.value)}
              />
              <FileInput
                placeholder="Upload a documents json file..."
                label="Documents"
                value={tasksFile}
                onChange={setTasksFile}
              />
              <Checkbox label="Import topics" checked={topicsIncluded} onChange={(event) => setTopicsIncluded(event.currentTarget.checked)} />
              {topicsIncluded && (
                <FileInput
                  placeholder="Upload a topics json file..."
                  label="Topics"
                  value={topicsFile}
                  onChange={setTopicsFile}
                />
              )}
              <Checkbox label="Import questions" checked={questionsIncluded} onChange={(event) => setQuestionsIncluded(event.currentTarget.checked)} />
              {questionsIncluded && (
                <FileInput
                  placeholder="Upload a topics json file..."
                  label="Questions"
                  value={questionsFile}
                  onChange={setQuestionsFile}
                />
              )}
              <Group position='right'>
                <Button onClick={createCollectionFromMultiple}>Create collection</Button>
              </Group>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Modal>

      {filteredTasks.length > 0 && (
        <Box mx="auto" sx={{ maxWidth: 1000 }}>

          <Tabs defaultValue="tasks">
            <Tabs.List >
              <Tabs.Tab value="questions">Questions ({questions.length})</Tabs.Tab>
              <Tabs.Tab value="tasks">Documents ({filteredTasks.length})</Tabs.Tab>
              <Tabs.Tab value="topics">Topics ({topics.length})</Tabs.Tab>
              <Tabs.Tab value="collection">Collection</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="questions" pt="xs">
              <Tabs defaultValue="preview">
                <Tabs.List>
                  <Tabs.Tab value="preview">Preview</Tabs.Tab>
                  <Tabs.Tab value="mapping">Mapping</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="preview" pt="xs">
                  <QuestionsBloc
                    values={{}}
                    onChange={() => { }}
                    questions={questions}
                    onAction={handleQuestionAction}
                    onQuestionsUpdate={onQuestionsUpdate}
                  />
                </Tabs.Panel>

                <Tabs.Panel value="mapping" pt="xs">
                  <QuestionsTopicsMatrix
                    questions={questions}
                    topics={topics}
                    onSave={handleSaveMapping}
                    selectTopic={selectTopic}
                    tasks={tasks}
                  />
                </Tabs.Panel>
              </Tabs>
            </Tabs.Panel>

            <Tabs.Panel value="tasks" pt="xs">
              <Grid grow>
                <Grid.Col sm={12} md={2}>
                  <Paper p="md" withBorder>
                    {currentTaskIndex < filteredTasks.length && (
                      <Box>
                        <Group spacing={5} mb="xl" position='right'>
                          <Button
                            variant='default'
                            leftIcon={<IconChevronLeft size={16} />}
                            onClick={handleBack}
                            disabled={currentTaskIndex === 0}
                          >
                            Previous
                          </Button>
                          <Group mx="auto" spacing={5}>
                            <TasksCounter
                              value={currentTaskIndex}
                              onChange={setCurrentTaskIndex}
                              max={filteredTasks.length}
                            />
                            <Menu shadow="md" width={200}>
                              <Menu.Target>
                                <ActionIcon size="lg">
                                  <IconDotsVertical size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item disabled={currentTaskIndex === 0} icon={<IconArrowBarToLeft size={16} />} onClick={handleBackToFirst}>Back to First</Menu.Item>
                                <Menu.Item disabled={currentTaskIndex >= filteredTasks.length - 1} icon={<IconArrowBarToRight size={16} />} onClick={handleNextToLast}>Go to Last</Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                          <Button
                            variant='default'
                            rightIcon={<IconChevronRight size={16} />}
                            onClick={() => handleNext()}
                            disabled={currentTaskIndex >= filteredTasks.length - 1}
                          >
                            Next
                          </Button>
                        </Group>
                        <Title mb="xs" order={4}>{filteredTasks[currentTaskIndex]?.title || "Loading..."}</Title>
                        <Box>
                          {filteredTasks[currentTaskIndex].sentences.map((s, i) =>
                            <Sentence
                              key={s.text}
                              item={s}
                              topics={topics}
                              relevantTopics={questions[questionIndex].relevantTopics}
                              onTopicChange={val => handleTaskTopicChange(i, val)}
                              onTopicUpdate={handleTaskTopicUpdate}
                            />
                          )}
                        </Box>
                        <Group>
                          <TopicsList
                            topics={topics}
                            task={filteredTasks[currentTaskIndex]}
                            questions={questions}
                            onSaveMapping={handleSaveMapping}
                            onTopicUpdate={handleTaskTopicUpdate}
                            tasks={tasks}
                            questionIndex={questionIndex}
                          />
                        </Group>

                      </Box>
                    )}
                  </Paper>
                </Grid.Col>
                <Grid.Col sm={12} md={1}>
                  <Paper withBorder shadow="lg" p="md">
                    {showFinish ? (
                      <Alert icon={<IconCheck size={24} />} title="Finished!" color="green">
                        You&apos;ve reached the end of the list!
                        <Group mt="xs">
                          <Button color="green" onClick={() => setShowFinish(false)}>Back</Button>
                        </Group>
                      </Alert>
                    ) : (
                      <QuestionsBloc
                        values={annotations}
                        onChange={setQuestionAnswer}
                        questions={questions}
                        questionIndex={questionIndex}
                        onQuestionIndexChange={setQuestionIndex}
                        tasks={filteredTasks}
                        onSkip={() => handleNext(currentTaskIndex + 1)}
                        relevancyFailedBlocs={testRelevancy(questions[questionIndex], filteredTasks[currentTaskIndex])}
                        currentTaskIndex={currentTaskIndex}
                      />
                    )}
                  </Paper>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            <Tabs.Panel value="topics" pt="xs">
              <Group mb="md">
                <Menu shadow="md">
                  <Menu.Target>
                    <Button variant='subtle' color="gray" rightIcon={<IconChevronDown size={14} />}>Selection</Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item color="blue" icon={<IconCheck size={14} />} onClick={toggleSelection}>Select all</Menu.Item>
                    <Menu.Label>Sorting by number of related documents</Menu.Label>
                    <Menu.Item icon={<IconSortDescendingNumbers size={14} />} onClick={() => sortTopicsBy('tasks', false)}>Documents descending</Menu.Item>
                    <Menu.Item icon={<IconSortAscendingNumbers size={14} />} onClick={() => sortTopicsBy('tasks', true)}>Documents ascending</Menu.Item>
                    <Menu.Label>Sorting by name</Menu.Label>
                    <Menu.Item icon={<IconSortDescendingLetters size={14} />} onClick={() => sortTopicsBy('name', false)}>Name descending</Menu.Item>
                    <Menu.Item icon={<IconSortAscendingLetters size={14} />} onClick={() => sortTopicsBy('name', true)}>Name ascending</Menu.Item>
                    <Menu.Label>Sorting by id</Menu.Label>
                    <Menu.Item icon={<IconSortDescendingLetters size={14} />} onClick={() => sortTopicsBy('id', false)}>Id descending</Menu.Item>
                    <Menu.Item icon={<IconSortAscendingLetters size={14} />} onClick={() => sortTopicsBy('id', true)}>Id ascending</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
                <Menu shadow="md">
                  <Menu.Target>
                    <Button variant='subtle' color="gray" rightIcon={<IconChevronDown size={14} />}>Format</Button>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item icon={<IconTextSpellcheck size={14} />} onClick={autoFormat}>Auto-format names</Menu.Item>
                    <Menu.Item icon={<IconColorSwatch size={14} />} onClick={autoColors}>Randomize colors</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
                <Menu shadow="md">
                  <Menu.Target>
                    <Button variant='subtle' color="gray" rightIcon={<IconChevronDown size={14} />}>Actions</Button>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item icon={<IconGripVertical size={14} />} onClick={() => setShowTopicsDragHandles(v => !v)}>Show drag handles</Menu.Item>
                    <Menu.Item icon={<IconEdit size={14} />} onClick={openBulkAnswers}>Set bulk answers</Menu.Item>
                    <Menu.Item color="red" onClick={openDeleteTopic} icon={<IconTrash size={14} />}>Delete topics</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
              <DragDropContext onDragEnd={handleDrop}>
                <Droppable droppableId="topics-dnd-list" direction="vertical">
                  {(dropProvided, dropSnap) => (
                    <div {...dropProvided.droppableProps} ref={dropProvided.innerRef}>
                      {topics.map((t, i) => (
                        <Draggable key={String(t.id)} index={i} draggableId={String(t.id)}>
                          {(dragProvided, dragSnap) =>
                            <TopicLine
                              showTopicsDragHandles={showTopicsDragHandles}
                              draggable={dragProvided}
                              key={t.id}
                              checked={selectedTopics.includes(t.id.toString())}
                              onCheck={() => handleCheckTopic(t)}
                              topic={t}
                              onChange={t => handleTopicChange(t, i)}
                              relatedTasks={tasks.filter(task => task.sentences.some(s => s.topic === t.id))}
                              selectTopic={() => selectTopic(t)}
                            />
                          }
                        </Draggable>
                      ))}
                      {dropProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </Tabs.Panel>

            <Tabs.Panel value="collection" pt="xs">
              <Group my="md">
                <Button leftIcon={<IconDownload size={16} />} onClick={exportTasks}>Export Documents</Button>
                <Button leftIcon={<IconDownload size={16} />} onClick={exportTopics}>Export Topics</Button>
                <Button leftIcon={<IconDownload size={16} />} onClick={exportQuestions}>Export Questions</Button>
                <Menu shadow="md">
                  <Menu.Target>
                    <ActionIcon variant='light'>
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Actions</Menu.Label>
                    <Menu.Item onClick={exportCombo} icon={<IconDownload size={14} />}>Export everything in one file</Menu.Item>
                    <Menu.Item onClick={exportTasksSubset} icon={<IconDownload size={14} />}>Export the filtered documents ({filteredTasks.length})</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
              <Stack>
                <TextInput
                  placeholder="Enter a name..."
                  label="Collection name"
                  value={collectionName}
                  onChange={e => setCollectionName(e.target.value)}
                />
                <Group position='right'>
                  <Popover opened={showDeletePopover} onChange={setShowDeletePopover} position="bottom" withArrow shadow="md">
                    <Popover.Target>
                      <Button onClick={() => setShowDeletePopover(v => !v)} color="red" mr="auto" variant="outline">Delete collection</Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Text size="sm">You&apos;re about to delete the current collection.</Text>
                      <Text size="sm">Are you sure?</Text>
                      <Group position='right' mt="xs">
                        <Button color="red" compact onClick={handleDeleteCollection}>Confirm deletion</Button>
                      </Group>
                    </Popover.Dropdown>
                  </Popover>
                  <Button disabled={collections.map(c => c.name).includes(collectionName)} onClick={handleDuplicateCollection}>Duplicate</Button>
                  <Button disabled={collections.map(c => c.name).includes(collectionName)} onClick={handleSaveCollection}>Save</Button>
                </Group>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Box>
      )}

      <Modal
        opened={showTopic}
        onClose={() => setShowTopic(false)}
        title="Topic related documents"
        size="xl"
        overflow="inside"
      >
        {selectedTopic && (
          <Accordion mt="md">
            <Accordion.Item value="sentences">
              <Accordion.Control>Related sentences ({relatedSentences.length})</Accordion.Control>
              <Accordion.Panel pt="xs">
                <SentencesList sentences={relatedSentences} />
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="tasks">
              <Accordion.Control>Related documents ({relatedTasks.length})</Accordion.Control>
              <Accordion.Panel pt="xs">
                <TasksList tasks={relatedTasks} topics={topics} />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        )}
        <Group mt="md" position="right">
          <Button variant="default" onClick={() => setShowTopic(false)}>Close</Button>
        </Group>
      </Modal>

      <Modal
        opened={showDeleteTopics}
        onClose={cancelDeleteTopics}
        title="Delete topics"
        size="xl"
        overflow="inside"
      >
        <Alert mb="xs" icon={<IconAlertCircle size={24} />} title="Delete topics" color="red">
          You&apos;re about to delete the selected topics ({selectedTopics.length}).
          Are you sure?
        </Alert>
        <Group my="md">
          <Checkbox
            label="Delete the unrelated documents at the same time as the topics"
            checked={deleteTasksWithTopics}
            onChange={(event) => setDeleteTasksWithTopics(event.currentTarget.checked)}
          />
        </Group>
        {deleteTasksWithTopics ? (
          <Box>
            <Alert mb="xs" icon={<IconAlertCircle size={24} />} title="Delete unrelated documents" color="red">
              You&apos;re about to delete the following {tasksToDelete.length} documents.
              Are you sure?
            </Alert>
            <Group mb="xl" position='center'>
              <Button variant='default' onClick={cancelDeleteTopics}>Cancel</Button>
              <Button color="red" onClick={confirmDeleteTopics}>Delete topics and documents</Button>
            </Group>
            <TasksList tasks={tasksToDelete} topics={topics} />
          </Box>
        ) : (
          <Group mb="xl" position='center'>
            <Button variant='default' onClick={cancelDeleteTopics}>Cancel</Button>
            <Button color="red" onClick={confirmDeleteTopics}>Delete topics</Button>
          </Group>
        )}
      </Modal>

      <Modal
        opened={showBulkAnswers}
        onClose={cancelBulk}
        title="Bulk answers"
        size="xl"
      >
        {tasksToBulkApply.length > 0 ? (
          <>
            {Object.keys(bulkAnnotations).length <= 0 ? (
              <Alert mb="md" icon={<IconTrash size={24} />} title="Deleting answers" color="red">
                Currently, no answers have been selected. <br />
                The action on the {tasksToBulkApply.length} selected documents will be to delete the saved answers.
              </Alert>
            ) : (
              <Alert icon={<IconAlertCircle size={24} />} title="Warning">
                The following answers will be applied to the {tasksToBulkApply.length} selected documents.
              </Alert>
            )}
            <QuestionsBloc
              values={bulkAnnotations}
              onChange={setBulkQuestionAnswer}
              questions={questions}
            />
            <Group position='right' mt="md">
              <Button variant='default'>Cancel</Button>
              <Button onClick={applyBulkAnswers}>Apply</Button>
            </Group>
          </>
        ) : (
          <>
            <Alert icon={<IconAlertCircle size={24} />} title="Warning">
              No documents have been selected.
            </Alert>
            <Group position='right' mt="md">
              <Button variant='default' onClick={cancelBulk}>Cancel</Button>
            </Group>
          </>
        )}
      </Modal>
    </Box>
  )
}


export default AnnotationsEditor