# MITRE ATLAS Quick Reference

A condensed reference for the MITRE ATLAS (Adversarial Threat Landscape for AI Systems) framework. Full details at [atlas.mitre.org](https://atlas.mitre.org/).

## Tactics (Ordered by Attack Lifecycle)

| ID | Tactic | Description |
|----|--------|-------------|
| AML.TA0000 | Reconnaissance | Gathering information about the target ML system |
| AML.TA0001 | Resource Development | Establishing resources to support operations against ML systems |
| AML.TA0002 | Initial Access | Gaining initial access to the ML system or its pipeline |
| AML.TA0003 | ML Model Access | Obtaining some level of access to the ML model |
| AML.TA0004 | Execution | Running adversary-controlled code or inputs in the ML pipeline |
| AML.TA0005 | Persistence | Maintaining access to the ML system across restarts or updates |
| AML.TA0006 | Defense Evasion | Avoiding detection by the ML system's defenses |
| AML.TA0007 | Discovery | Learning about the ML system's internals and environment |
| AML.TA0008 | Collection | Gathering data from the ML system |
| AML.TA0009 | ML Attack Staging | Preparing attacks specific to ML systems |
| AML.TA0010 | Exfiltration | Stealing data or model information from the ML system |
| AML.TA0011 | Impact | Disrupting or degrading the ML system's performance |

## Key Techniques (Most Commonly Referenced)

### Reconnaissance
| ID | Technique | What It Means |
|----|-----------|---------------|
| AML.T0000 | Search for Victim's Publicly Available Research Materials | Finding papers, blogs, talks that reveal model architecture or training details |
| AML.T0001 | Search Victim's Open Source ML Assets | Locating model weights, datasets, or code the target has published |
| AML.T0002 | Search for Publicly Available Adversarial Datasets | Finding datasets designed to test or attack similar models |

### Resource Development
| ID | Technique | What It Means |
|----|-----------|---------------|
| AML.T0003 | Acquire ML Artifacts | Obtaining models, datasets, or tools to use in attacks |
| AML.T0004 | Develop ML Artifacts | Creating custom models, adversarial examples, or poisoned data |

### Initial Access
| ID | Technique | What It Means |
|----|-----------|---------------|
| AML.T0005 | ML Supply Chain Compromise | Compromising training data, pre-trained models, or ML libraries upstream |
| AML.T0006 | Data Poisoning | Inserting malicious data into the training pipeline |

### ML Model Access
| ID | Technique | What It Means |
|----|-----------|---------------|
| AML.T0007 | Inference API Access | Using the model's prediction API to probe or exploit it |
| AML.T0008 | Physical Environment Access | Manipulating the physical world the model perceives (e.g., adversarial patches) |

### Execution
| ID | Technique | What It Means |
|----|-----------|---------------|
| AML.T0009 | User Execution | Tricking a user into running adversary-controlled ML artifacts |
| AML.T0010 | ML-Enabled Product Abuse | Abusing an ML product's intended functionality for malicious purposes |
| AML.T0011 | LLM Prompt Injection | Injecting instructions into LLM inputs to override intended behavior |
| AML.T0052 | Phishing | Using ML-generated content for social engineering |
| AML.T0054 | LLM Jailbreak | Bypassing LLM safety filters to produce restricted content |

### Persistence
| ID | Technique | What It Means |
|----|-----------|---------------|
| AML.T0012 | Backdoor ML Model | Embedding hidden triggers in a model that activate on specific inputs |
| AML.T0013 | Poison Training Data | Persistently corrupting the model by tainting its ongoing training data |

### Defense Evasion
| ID | Technique | What It Means |
|----|-----------|---------------|
| AML.T0015 | Evade ML Model | Crafting inputs that cause the model to misclassify or misbehave |
| AML.T0046 | Adversarial Text | Text specifically crafted to evade NLP model detection |

### Discovery
| ID | Technique | What It Means |
|----|-----------|---------------|
| AML.T0016 | Discover ML Model Ontology | Learning what categories or concepts a model can recognize |
| AML.T0017 | Discover ML Model Family | Identifying what type of model (CNN, transformer, etc.) the target uses |
| AML.T0044 | Full ML Model Access | Obtaining complete white-box access to model weights and architecture |

### ML Attack Staging
| ID | Technique | What It Means |
|----|-----------|---------------|
| AML.T0043 | Craft Adversarial Data | Creating inputs specifically designed to fool the model |
| AML.T0020 | Poison ML Model | Modifying the model itself to embed malicious behavior |

### Exfiltration
| ID | Technique | What It Means |
|----|-----------|---------------|
| AML.T0024 | Exfiltration via ML Inference API | Extracting training data or model details through query responses |
| AML.T0035 | ML Model Inference API Extraction | Stealing a model by querying it enough times to recreate it |
| AML.T0037 | Data from Information Repositories | Extracting data the model has memorized from its training set |
| AML.T0025 | Exfiltration via Cyber Means | Using traditional exfiltration to steal ML assets |

### Impact
| ID | Technique | What It Means |
|----|-----------|---------------|
| AML.T0029 | Denial of ML Service | Making the ML system unavailable or unusably slow |
| AML.T0031 | Erode ML Model Integrity | Gradually degrading model accuracy through adversarial interactions |
| AML.T0034 | Cost Harvesting | Driving up the target's compute costs through expensive queries |
| AML.T0048 | Intellectual Property Theft of ML Model | Stealing the model itself as a valuable asset |

## Common Attack Chains

### Prompt Injection Chain
1. AML.TA0000 Reconnaissance → find how the LLM is deployed
2. AML.TA0003 ML Model Access → gain inference API access (AML.T0007)
3. AML.TA0004 Execution → LLM prompt injection (AML.T0011)
4. AML.TA0008 Collection / AML.TA0010 Exfiltration → extract system prompts or user data

### Model Theft Chain
1. AML.TA0000 Reconnaissance → identify model type and API
2. AML.TA0003 ML Model Access → inference API access (AML.T0007)
3. AML.TA0009 ML Attack Staging → systematic querying
4. AML.TA0010 Exfiltration → model extraction (AML.T0035)

### Data Poisoning Chain
1. AML.TA0001 Resource Development → develop poisoned data (AML.T0004)
2. AML.TA0002 Initial Access → supply chain compromise (AML.T0005)
3. AML.TA0005 Persistence → poison training data (AML.T0013)
4. AML.TA0011 Impact → erode model integrity (AML.T0031)

## How to Use This Reference

When analyzing a paper:
1. Identify the primary tactic (what phase of the attack lifecycle does this cover?)
2. Map to specific techniques (what exact method is used?)
3. Look for chains (does this technique enable or require other techniques?)
4. Note gaps (does the paper describe something ATLAS doesn't cover yet?)
