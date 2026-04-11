WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql"
WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php"
WIKIPEDIA_API_URL = "https://en.wikipedia.org/api/rest_v1/page/summary"

USER_AGENT = "WikiGraphExplorer/1.0 (side-project; https://github.com/wikigraph-explorer)"

MAX_CONCURRENT_SPARQL = 2
SPARQL_RATE_LIMIT_PER_SEC = 1.0
SPARQL_TIMEOUT_SEC = 30
BFS_MAX_DEPTH = 4
BFS_BATCH_SIZE = 10
INCOMING_NEIGHBOR_LIMIT = 100
CACHE_EXPIRY_DAYS = 7

DB_PATH = "../data/wikigraph_cache.db"

# Supernode categories — user can toggle these to control path "obscurity"
# Filtering more categories = more obscure/creative paths
SUPERNODE_CATEGORIES = {
    "type_classes": {
        "label": "Type classes (human, country, city)",
        "default": True,
        "qids": {
            "Q5",        # human
            "Q515",      # city
            "Q6256",     # country
            "Q532",      # village
            "Q486972",   # human settlement
            "Q2221906",  # geographic location
            "Q35120",    # entity
            "Q43229",    # organization
            "Q4830453",  # business
            "Q82955",    # politician
            "Q2385804",  # educational institution
            "Q15401930", # product
            "Q12737077", # occupation
            "Q891723",   # public company
            "Q783794",   # company
            "Q431289",   # brand
            "Q618779",   # award
            "Q4438121",  # sports organization
            "Q24229398", # agent
            "Q215380",   # musical group
        },
        "blocked_properties": set(),
    },
    "citizenship_country": {
        "label": "Citizenship/country shortcuts",
        "default": True,
        "qids": set(),
        "blocked_properties": {"P27", "P17"},  # country of citizenship, country
    },
    "intl_orgs": {
        "label": "International orgs (UN, EU, NATO)",
        "default": True,
        "qids": {
            "Q1065", "Q458", "Q7184", "Q7825", "Q41550",
            "Q7804", "Q656801", "Q7159", "Q8908", "Q81299", "Q37470", "Q7785",
        },
        "blocked_properties": set(),
    },
    "geography": {
        "label": "Geography (borders, admin territory)",
        "default": False,
        "qids": set(),
        "blocked_properties": {"P47", "P131", "P150", "P36", "P30"},  # borders, admin, capital, continent
    },
    "media": {
        "label": "Media types (film, album, TV series)",
        "default": True,
        "qids": {"Q11424", "Q7889", "Q5398426", "Q482994", "Q134556", "Q7725634", "Q3305213"},
        "blocked_properties": set(),
    },
    "wiki_internal": {
        "label": "Wikimedia internal pages",
        "default": True,
        "qids": {"Q4167410", "Q13442814", "Q4167836", "Q3624078"},
        "blocked_properties": set(),
    },
    "science": {
        "label": "Scientific entities (taxon, gene, protein)",
        "default": True,
        "qids": {"Q16521", "Q7187", "Q8054", "Q523", "Q8502"},
        "blocked_properties": set(),
    },
}

def get_filters(active_categories: list[str] | None = None) -> tuple[set[str], set[str]]:
    """Return (blocked_qids, blocked_properties) based on active filter categories."""
    if active_categories is None:
        cats = [cat for cat in SUPERNODE_CATEGORIES.values() if cat["default"]]
    else:
        cats = [SUPERNODE_CATEGORIES[k] for k in active_categories if k in SUPERNODE_CATEGORIES]

    blocked_qids: set[str] = set()
    blocked_props: set[str] = set()
    for cat in cats:
        blocked_qids.update(cat["qids"])
        blocked_props.update(cat["blocked_properties"])
    return blocked_qids, blocked_props

# Curated property whitelist for meaningful connections
PROPERTIES = [
    # General
    "P31",    # instance of
    "P279",   # subclass of
    "P361",   # part of
    "P527",   # has part

    # People
    "P27",    # country of citizenship
    "P19",    # place of birth
    "P20",    # place of death
    "P69",    # educated at
    "P108",   # employer
    "P39",    # position held
    "P26",    # spouse
    "P22",    # father
    "P25",    # mother
    "P40",    # child
    "P3373",  # sibling
    "P463",   # member of
    "P102",   # member of political party
    "P166",   # award received
    "P1344",  # participant in
    "P800",   # notable work
    "P106",   # occupation
    "P551",   # residence

    # Places
    "P17",    # country
    "P131",   # located in admin territory
    "P36",    # capital
    "P150",   # contains admin territory
    "P30",    # continent
    "P47",    # shares border with
    "P37",    # official language
    "P6",     # head of government
    "P35",    # head of state
    "P1376",  # capital of

    # Organizations
    "P159",   # headquarters location
    "P112",   # founded by
    "P127",   # owned by
    "P749",   # parent organization
    "P355",   # subsidiary
    "P169",   # chief executive officer
    "P488",   # chairperson

    # Creative works
    "P50",    # author
    "P57",    # director
    "P86",    # composer
    "P161",   # cast member
    "P175",   # performer
    "P264",   # record label
    "P495",   # country of origin
    "P136",   # genre
]
